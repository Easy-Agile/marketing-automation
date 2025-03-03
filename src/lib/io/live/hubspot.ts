import * as hubspot from '@hubspot/api-client';
import assert from 'assert';
import { Association, EntityKind, ExistingEntity, FullEntity, NewEntity, RelativeAssociation } from '../../model/hubspot/interfaces.js';
import env from '../../parameters/env.js';
import { SimpleError } from '../../util/errors.js';
import { batchesOf } from '../../util/helpers.js';
import cache from '../cache.js';
import { HubspotService, Progress } from '../interfaces.js';

export default class LiveHubspotService implements HubspotService {

  client = new hubspot.Client({ apiKey: env.hubspot.apiKey });

  async downloadEntities(_progess: Progress, kind: EntityKind, apiProperties: string[], inputAssociations: string[]): Promise<FullEntity[]> {
    let associations = ((inputAssociations.length > 0)
      ? inputAssociations
      : undefined);

    try {
      const entities = await this.apiFor(kind).getAll(undefined, undefined, apiProperties, associations);
      const normalizedEntities = entities.map(({ id, properties, associations }) => ({
        id,
        properties,
        associations: Object.entries(associations || {})
          .flatMap(([, { results }]) => (
            results.map(item => {
              const prefix = `${kind}_to_`;
              assert.ok(item.type.startsWith(prefix));
              const otherKind = item.type.substr(prefix.length) as EntityKind;
              return `${otherKind}:${item.id}` as RelativeAssociation;
            })
          )),
      }));
      return cache(`${kind}.json`, normalizedEntities);
    }
    catch (e: any) {
      const body = e.response.body;
      if (
        (
          typeof body === 'string' && (
            body === 'internal error' ||
            body.startsWith('<!DOCTYPE html>'))
        ) || (
          typeof body === 'object' &&
          body.status === 'error' &&
          body.message === 'internal error'
        )
      ) {
        throw new SimpleError(`Hubspot v3 API for "${kind}" had internal error.`);
      }
      else {
        throw new Error(`Failed downloading ${kind}s: ${JSON.stringify(body)}`);
      }
    }
  }

  async createEntities(kind: EntityKind, entities: NewEntity[]): Promise<ExistingEntity[]> {
    return await this.batchDo(kind, entities, async entities => {
      const response = await this.apiFor(kind).batchApi.create({ inputs: entities });
      return response.body.results;
    });
  }

  async updateEntities(kind: EntityKind, entities: ExistingEntity[]): Promise<ExistingEntity[]> {
    return await this.batchDo(kind, entities, async entities => {
      const response = await this.apiFor(kind).batchApi.update({ inputs: entities });
      return response.body.results;
    });
  }

  private async batchDo<T, U>(kind: EntityKind, entities: T[], fn: (array: T[]) => Promise<U[]>) {
    const batchSize = kind === 'contact' ? 10 : 100;
    const entityGroups = batchesOf(entities, batchSize);

    const promises = entityGroups.map(async (entities) => {
      try {
        return await fn(entities);
      }
      catch (e: any) {
        throw new Error(e.response.body.message);
      }
    });

    const resultGroups = await Promise.all(promises);
    return resultGroups.flat(1);
  }

  async createAssociations(fromKind: EntityKind, toKind: EntityKind, inputs: Association[]): Promise<void> {
    for (const inputBatch of batchesOf(inputs, 100)) {
      await this.client.crm.associations.batchApi.create(fromKind, toKind, {
        inputs: inputBatch.map(input => mapAssociationInput(fromKind, input))
      });
    }
  }

  async deleteAssociations(fromKind: EntityKind, toKind: EntityKind, inputs: Association[]): Promise<void> {
    for (const inputBatch of batchesOf(inputs, 100)) {
      await this.client.crm.associations.batchApi.archive(fromKind, toKind, {
        inputs: inputBatch.map(input => mapAssociationInput(fromKind, input))
      });
    }
  }

  private apiFor(kind: EntityKind) {
    switch (kind) {
      case 'deal': return this.client.crm.deals;
      case 'company': return this.client.crm.companies;
      case 'contact': return this.client.crm.contacts;
    }
  }

}

function mapAssociationInput(fromKind: EntityKind, input: Association) {
  return {
    from: { id: input.fromId },
    to: { id: input.toId },
    type: `${fromKind}_${input.toType}`,
  };
}

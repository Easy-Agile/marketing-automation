import { Contact } from "./contact.js";
import { Entity } from "./hubspot/entity.js";
import { EntityKind } from "./hubspot/interfaces.js";
import { EntityManager, PropertyTransformers } from "./hubspot/manager.js";

type CompanyData = {
  domain: string;
  additionalDomains: string[];
  name: string;
  type: 'Partner' | null;
};

export class Company extends Entity<CompanyData> {
  contacts = this.makeDynamicAssociation<Contact>('contact');
  parent = this.makeDynamicAssociation<Company>('company');
}

export class CompanyManager extends EntityManager<CompanyData, Company> {

  override Entity = Company;
  override kind: EntityKind = 'company';

  override associations: EntityKind[] = [
    'company',
    'contact',
  ];

  override apiProperties: string[] = [
    'domain',
    'hs_additional_domains',
    'name',
    'type',
  ];

  override fromAPI(data: { [key: string]: string | null }): CompanyData | null {
    return {
      additionalDomains: data['hs_additional_domains']?.split(';') ?? [],
      domain: data['domain'] ?? '',
      name: data['name'] ?? '',
      type: data['type'] === 'PARTNER' ? 'Partner' : null,
    };
  }

  override toAPI: PropertyTransformers<CompanyData> = {
    additionalDomains: (additionalDomains: string[]) => ['hs_additional_domains', additionalDomains.join(';')],
    domain: domain => ['domain', domain],
    name: name => ['name', name],
    type: type => ['type', type === 'Partner' ? 'PARTNER' : ''],
  };

  override identifiers: (keyof CompanyData)[] = [
    "domain",
  ];

}

import { readJsonFile } from "../../cache/datadir.js";
import { Database } from "../../model/database.js"
import psl from "psl";
import { Contact } from "../../model/contact.js";
import { Company } from "../../model/company.js";
import log from "../../log/logger.js";

interface ClearbitCompanyData {
    id: string;
    name: string;
    domain: string;
    domainAliases: string[];
    parent: {
        domain: string | null;
    }
}

export class CompanyGenerator {
    db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    private getClearbitMap() {
        const clearbitData: ClearbitCompanyData[] = readJsonFile("in", "clearbit.json");
        const clearbitMap: Map<string, ClearbitCompanyData> = new Map();

        for (const company of clearbitData) {
            clearbitMap.set(company.domain, company);
            for (const domainAlias of company.domainAliases) {
                clearbitMap.set(domainAlias, company);
            }
        }

        return clearbitMap;
    }

    private getContactDomainMap() {
        const contacts = this.db.contactManager.getAll();
        const domains: Map<string, Contact[]> = new Map();

        for (const contact of contacts) {
            const { email } = contact.data;
            const fullDomain = email.substr(email.lastIndexOf("@") + 1);
            const domain = psl.get(fullDomain);

            if (!domain || this.db.providerDomains.has(domain)) {
                continue;
            }

            const existing = domains.get(domain) ?? [];
            existing.push(contact);

            domains.set(domain, existing);
        }

        return domains;
    }

    private getCompanyMap() {
        const companies = this.db.companyManager.getAll();
        const companyMap: Map<string, Company> = new Map();

        for (const company of companies) {
            companyMap.set(company.data.domain, company);
        }

        return companyMap;
    }

    private findOrCreateCompany(companyMap: Map<string, Company>, clearbitInfo:ClearbitCompanyData) {
        const existingCompany = companyMap.get(clearbitInfo.domain);
        if (existingCompany) {
            if (!existingCompany.data.additionalDomains) {
                existingCompany.set("additionalDomains", clearbitInfo.domainAliases);
            }

            return existingCompany;
        } else {
            return this.db.companyManager.create({
                additionalDomains: clearbitInfo.domainAliases,
                domain: clearbitInfo.domain,
                name: clearbitInfo.name || clearbitInfo.domain, // use company name from license/transaction here instead
                type: null,
            });
        }
    }

    private generateCompanies(
        clearbitMap: Map<string, ClearbitCompanyData>,
        contactDomainMap: Map<string, Contact[]>,
        companies: Map<string, Company>
    ) {
        for (const [domain] of contactDomainMap.entries()) {
            // TODO: look in cache or fetch here
            const clearbitMatch = clearbitMap.get(domain);
            if (!clearbitMatch) {
                continue;
            }

            this.findOrCreateCompany(companies, clearbitMatch);
        }
    }

    run() {
        const clearbitMap = this.getClearbitMap();
        const contactDomainMap = this.getContactDomainMap();

        this.generateCompanies(clearbitMap, contactDomainMap, this.getCompanyMap());
    }

    generateAssociations() {
        const companies = this.getCompanyMap();
        const contactDomainMap = this.getContactDomainMap();
        const clearbitMap = this.getClearbitMap();

        for (const [domain, company] of companies) {
            const contacts = contactDomainMap.get(domain) || [];
            for (const contact of contacts) {
                contact.companies.clear();
                contact.companies.add(company);
            }

            const clearbitData = clearbitMap.get(domain);
            const { domain: parentDomain } = clearbitData?.parent ?? {};
            if (!parentDomain) {
                continue;
            }

            const parentCompany = companies.get(parentDomain);
            if (!parentCompany) {
                continue;
            }

            company.parent.clear();
            company.parent.add(parentCompany);
            log.info(`Company Generator`, `Added ${parentCompany.data.domain} as parent of ${company.data.domain}`)
        }
    }
}

import { ConversationReference, Storage } from "botbuilder";

export class ConversationReferenceStore {
    private readonly storage: Storage;
    private readonly storageKey: string;

    constructor(storage: Storage, storageKey: string) {
        this.storage = storage;
        this.storageKey = storageKey
    }

    async list(): Promise<Partial<ConversationReference>[]> {
        const items = await this.storage.read([this.storageKey]);
        const references = items[this.storageKey] ?? new Array<Partial<ConversationReference>>();

        return references;
    }

    async add(reference: Partial<ConversationReference>): Promise<Partial<ConversationReference>[]> {
        const references = await this.list();
        if (new Set(references).has(reference)) {
            return references;
        }

        references.push(reference);
        await this.storage.write({ [this.storageKey]: references })
        return references;
    }

    update(reference: Partial<ConversationReference>): Promise<void> {
        throw new Error("Method not implemented.");
    }

    delete(reference: Partial<ConversationReference>): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
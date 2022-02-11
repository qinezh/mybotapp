import { ConversationReference } from "botbuilder";
import * as fs from "fs";

export interface ConversationReferenceStore {
    getAll(): Promise<Set<Partial<ConversationReference>>>;
    add(reference: Partial<ConversationReference>): Promise<void>;
    update(reference: Partial<ConversationReference>): Promise<void>;
    delete(reference: Partial<ConversationReference>): Promise<void>;
}

export class ConversationReferenceFileStore implements ConversationReferenceStore {
    private filePath: string;
    private references: Set<Partial<ConversationReference>> | undefined;

    constructor(filePath?: string) {
        this.filePath = filePath ?? "./conversationReferences.json";
    }

    getAll(): Promise<Set<Partial<ConversationReference>>> {
        if (this.references === undefined) {
            if (fs.existsSync(this.filePath)) {
                const data = fs.readFileSync(this.filePath, { encoding: "utf-8" });
                this.references = JSON.parse(data);
            }
        }

        return Promise.resolve(this.references);
    }

    add(reference: Partial<ConversationReference>): Promise<void> {
        if (this.references === undefined) {
            this.references = new Set();
        }

        this.references.add(reference);
        const content = JSON.stringify(Array.from(this.references));
        fs.writeFileSync(this.filePath, content, { encoding: "utf-8" });

        return Promise.resolve();
    }

    update(reference: Partial<ConversationReference>): Promise<void> {
        throw new Error("Method not implemented.");
    }
    delete(reference: Partial<ConversationReference>): Promise<void> {
        throw new Error("Method not implemented.");
    }

}
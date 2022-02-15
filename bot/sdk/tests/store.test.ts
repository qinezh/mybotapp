import "mocha";
import { assert } from "chai";
import { FileStorage } from "../fileStorage";
import { ConversationReferenceStore } from "../store";
import { ConversationReference } from "botbuilder";
import * as fse from "fs-extra";

describe("File Store Test", () => {
    const filePath = "./store.test.json";
    const storeKey = "fileStoreTest";

    afterEach(async () => {
        await fse.remove(filePath);
    });

    const channelReference = {
        "activityId": "0",
    } as Partial<ConversationReference>;
    const personalReference = {
        "activityId": "1",
    } as Partial<ConversationReference>;

    it("basic file store", async () => {
        const store = new ConversationReferenceStore(new FileStorage(filePath), storeKey);
        let references = await store.add(channelReference);
        assert.equal(references[0].activityId, "0");

        references = await store.add(personalReference);
        assert.equal(references[1].activityId, "1");
    });
});
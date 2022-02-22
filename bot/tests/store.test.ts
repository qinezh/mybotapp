import "mocha";
import { assert } from "chai";
import { FileStorage } from "../src/sdk/fileStorage";
import { BotSettingsStore, ConversationReferenceStore } from "../src/sdk/store";
import { ConversationReference } from "botbuilder";
import * as fse from "fs-extra";

describe("Conversation Reference Store Test", () => {
    const filePath = "./store.test.json";
    const storeKey = "fileStoreTest";

    afterEach(async () => {
        await fse.remove(filePath);
    });

    const channelReference = {
        "activityId": "0",
        "conversation": {
            "id": "0"
        }
    } as Partial<ConversationReference>;
    const personalReference = {
        "activityId": "1",
        "conversation": {
            "id": "1"
        }
    } as Partial<ConversationReference>;

    it("basic file store", async () => {
        const store = new ConversationReferenceStore(new FileStorage(filePath), storeKey);
        let references = await store.add(channelReference);
        assert.equal(references[0].activityId, "0");

        references = await store.add(personalReference);
        assert.equal(references[1].activityId, "1");
    });
});

describe("Settings Store Test", () => {
    const filePath = "./settingStore.test.json";
    const storeKey = "settingsStoreTest";

    const setting1 = {
        "teams1": {
            "enabled": true
        }
    };
    const setting2 = {
        "teams2": {
            "enabled": false
        }
    };

    afterEach(async () => {
        await fse.remove(filePath);
    });

    it("basic settings store", async () => {
        const store = new BotSettingsStore(new FileStorage(filePath), storeKey);
        await store.set("subs1", setting1);
        await store.set("subs2", setting2);

        const actual_setting1 = await store.get("subs1");
        const actual_setting2 = await store.get("subs2");


        assert.deepEqual(actual_setting1, setting1);
        assert.deepEqual(actual_setting2, setting2);
    });
});
import "mocha";
import { assert } from "chai";
import { FileStorage } from "../fileStorage";
import * as fse from "fs-extra";

describe("File Storage Test", () => {
    const filePath = "./storage.test.json";

    afterEach(async () => {
        await fse.remove(filePath);
    });

    it("basic read & write", async () => {
        const store = new FileStorage(filePath);

        await store.write({ "foo": { "value": [1] } });
        let data = await store.read(["foo"]);
        assert.deepEqual(data["foo"].value, [1]);

        data["foo"].value.push(2);
        await store.write(data);
        assert.deepEqual(data["foo"].value, [1, 2]);

        await store.write({ "bar": { "value": 3 } });
        data = await store.read(["foo", "bar"]);
        assert.deepEqual(data["foo"].value, [1, 2]);
        assert.equal(data["bar"].value, 3);

        data = await store.read(["foo"]);
        assert.deepEqual(data["foo"].value, [1, 2]);
        assert.isUndefined(data["bar"]);
    });
});
// Create HTTP server.
import * as restify from "restify";

export const server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\nBot Started, ${server.name} listening to ${server.url}`);
});

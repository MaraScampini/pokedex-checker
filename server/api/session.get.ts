export default defineEventHandler(async (event) => ({ signedIn: await isSignedIn(event) }))

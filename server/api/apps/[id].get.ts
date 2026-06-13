import { requireOwnedApp } from "../../utils/apps";

export default defineEventHandler(async (event) => {
  const { app } = await requireOwnedApp(event, getRouterParam(event, "id"));
  return app;
});

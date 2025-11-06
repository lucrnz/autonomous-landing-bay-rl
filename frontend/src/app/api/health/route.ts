import { StatusCodes } from "http-status-codes";

export async function GET() {
  return Response.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    { status: StatusCodes.OK }
  );
}

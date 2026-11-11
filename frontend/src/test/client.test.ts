import { describe, expect, it } from "vitest";

import { parseError } from "../api/client";

describe("parseError", () => {
  it("uses the detail message", () => {
    const error = parseError(401, { detail: "Incorrect username or password." });

    expect(error.status).toBe(401);
    expect(error.message).toBe("Incorrect username or password.");
  });

  it("collects field errors", () => {
    const error = parseError(400, { title: ["Title must not be blank."] });

    expect(error.message).toBe("Title must not be blank.");
    expect(error.fieldErrors).toEqual({ title: ["Title must not be blank."] });
  });

  it("falls back to a generic message", () => {
    expect(parseError(500, null).message).toBe("Request failed with status 500");
  });
});

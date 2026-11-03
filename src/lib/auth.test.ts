import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AuthApiError,
  checkCurrentSession,
  loginAccount,
  logoutAccount,
  registerAccount,
  validateLogin,
  validateRegistration,
} from "./auth";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("authentication form validation", () => {
  it("returns field-level errors for invalid registration details", () => {
    expect(
      validateRegistration({
        name: " ",
        username: " ",
        email: "not-an-email",
        password: "short",
      }),
    ).toEqual({
      name: "Enter your name.",
      username: "Choose a username.",
      email: "Enter a valid email address.",
      password: "Use at least 8 characters for your password.",
    });
  });

  it("accepts valid registration details", () => {
    expect(
      validateRegistration({
        name: "Avery Lane",
        username: "averylane",
        email: "avery@example.com",
        password: "pinecrest123",
      }),
    ).toEqual({});
  });

  it("rejects invalid login details before making a request", () => {
    expect(validateLogin({ email: "bad", password: "" })).toEqual({
      email: "Enter a valid email address.",
      password: "Enter your password.",
    });
  });
});

describe("authentication API client", () => {
  it("posts registration details with credentials included", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await registerAccount({
      name: " Avery Lane ",
      username: " averylane ",
      email: " avery@example.com ",
      password: "pinecrest123",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/auth/register",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          name: "Avery Lane",
          username: "averylane",
          email: "avery@example.com",
          password: "pinecrest123",
        }),
      }),
    );
  });

  it("restores a session with the backend and treats 401 as signed out", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Not signed in." }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkCurrentSession()).resolves.toBe(true);
    await expect(checkCurrentSession()).resolves.toBe(false);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:4000/api/v1/auth/me",
      expect.objectContaining({ credentials: "include", cache: "no-store" }),
    );
  });

  it("posts logout with credentials included", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await logoutAccount();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/auth/logout",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("surfaces backend login rejection without hiding the failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Invalid email or password." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      loginAccount({ email: "avery@example.com", password: "incorrect" }),
    ).rejects.toMatchObject({
      name: "AuthApiError",
      message: "Invalid email or password.",
    });
  });

  it("maps duplicate registration errors to the affected field", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "This account already exists.",
          errors: { email: ["That email is already registered."] },
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      registerAccount({
        name: "Avery Lane",
        username: "averylane",
        email: "avery@example.com",
        password: "pinecrest123",
      }),
    ).rejects.toMatchObject({
      name: "AuthApiError",
      message: "This account already exists.",
      fieldErrors: { email: "That email is already registered." },
    } satisfies Partial<AuthApiError>);
  });
});

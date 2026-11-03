import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/layout/auth-form";
import { AuthGate } from "@/components/layout/auth-gate";
import { AuthProvider } from "@/components/layout/auth-provider";
import { AppHeader } from "@/components/layout/app-header";
import { apiRequest } from "@/services/api-client";

const navigation = vi.hoisted(() => ({
  pathname: "/",
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace: navigation.replace }),
}));

vi.mock("next/link", () => ({ default: "a" }));

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
    text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
  } as unknown as Response;
}

function mountApp(children: React.ReactNode) {
  return render(
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>,
  );
}

describe("centralized authentication", () => {
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    navigation.pathname = "/";
    navigation.replace.mockClear();
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000/api/v1";
    fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects unauthenticated users away from protected routes", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
        401,
      ),
    );

    mountApp(<p>Private workspace</p>);

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith("/login?next=%2F");
    });
    expect(screen.queryByText("Private workspace")).not.toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/auth/me",
      expect.objectContaining({ credentials: "include", cache: "no-store" }),
    );
  });

  it("shows field-level validation before submitting registration", async () => {
    navigation.pathname = "/register";
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
        401,
      ),
    );

    mountApp(<AuthForm mode="register" />);

    await screen.findByRole("heading", { name: "Create your account" });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Enter your name.")).toBeTruthy();
    expect(screen.getByText("Enter a username.")).toBeTruthy();
    expect(screen.getByText("Enter your email address.")).toBeTruthy();
    expect(screen.getByText("Enter your password.")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("registers with all required fields and restores the cookie session", async () => {
    navigation.pathname = "/register";
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
          401,
        ),
      )
      .mockResolvedValueOnce(jsonResponse({ data: { created: true } }, 201))
      .mockResolvedValueOnce(
        jsonResponse({
          data: { user: { id: "user-1", email: "ada@example.com" } },
        }),
      );

    mountApp(<AuthForm mode="register" />);

    await screen.findByRole("heading", { name: "Create your account" });
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "ada" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "backend-managed-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith("/");
    });

    const [registerUrl, registerOptions] = fetchMock.mock.calls[1];
    expect(registerUrl).toBe("http://localhost:4000/api/v1/auth/register");
    expect(registerOptions).toMatchObject({
      method: "POST",
      credentials: "include",
    });
    expect(JSON.parse(String(registerOptions?.body))).toEqual({
      name: "Ada Lovelace",
      username: "ada",
      email: "ada@example.com",
      password: "backend-managed-password",
    });
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      credentials: "include",
    });
  });

  it("establishes an authenticated session after login", async () => {
    navigation.pathname = "/login";
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
          401,
        ),
      )
      .mockResolvedValueOnce(jsonResponse({ data: { loggedIn: true } }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: { user: { id: "user-1", email: "ada@example.com" } },
        }),
      );

    mountApp(<AuthForm mode="login" />);

    await screen.findByRole("heading", { name: "Welcome back" });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "valid-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith("/");
    });

    const [loginUrl, loginOptions] = fetchMock.mock.calls[1];
    expect(loginUrl).toBe("http://localhost:4000/api/v1/auth/login");
    expect(loginOptions).toMatchObject({
      method: "POST",
      credentials: "include",
    });
    expect(JSON.parse(String(loginOptions?.body))).toEqual({
      email: "ada@example.com",
      password: "valid-password",
    });
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      credentials: "include",
    });
  });

  it("updates application state immediately after a successful logout", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          data: { user: { id: "user-1", email: "ada@example.com" } },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: { loggedOut: true } }));

    mountApp(<AppHeader />);
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith("/login?next=%2F");
    });
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:4000/api/v1/auth/logout",
    );
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: "POST",
      credentials: "include",
    });
  });

  it("clears the session and redirects after a protected request returns 401", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          data: { user: { id: "user-1", email: "ada@example.com" } },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          { error: { code: "SESSION_EXPIRED", message: "Session expired." } },
          401,
        ),
      );

    mountApp(<p>Private workspace</p>);
    await screen.findByText("Private workspace");

    await expect(apiRequest("projects")).rejects.toMatchObject({
      status: 401,
      code: "SESSION_EXPIRED",
    });

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith("/login?next=%2F");
    });
    expect(screen.queryByText("Private workspace")).not.toBeTruthy();
  });
});

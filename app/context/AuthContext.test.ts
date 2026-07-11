import assert from "node:assert/strict";
import test from "node:test";
import { PublicAppError } from "../services/errors.ts";
import {
  authReducer,
  initialAuthState,
  protectedRouteFor,
} from "./authState.ts";
const session = {
  user: { id: "10000000-0000-4000-8000-000000000001" },
} as unknown as import("@supabase/supabase-js").Session;
test("restored new user enters onboarding", () =>
  assert.equal(
    authReducer(initialAuthState, {
      type: "RESTORED",
      session,
      onboardingComplete: false,
    }).status,
    "onboarding",
  ));
test("restored complete user reaches ready state", () =>
  assert.equal(
    authReducer(initialAuthState, {
      type: "RESTORED",
      session,
      onboardingComplete: true,
    }).status,
    "ready",
  ));
test("logout clears session authority", () =>
  assert.deepEqual(
    authReducer(
      { ...initialAuthState, status: "ready", session, user: session.user },
      { type: "SIGNED_OUT" },
    ),
    { ...initialAuthState, status: "signed_out" },
  ));
test("expired or failed restoration fails closed", () =>
  assert.equal(
    authReducer(initialAuthState, {
      type: "FAILED",
      error: new PublicAppError("auth_session_expired", "expired"),
    }).status,
    "error",
  ));
test("protected route sends signed-out users to the entry choice screen", () =>
  assert.equal(
    protectedRouteFor("signed_out", {
      inAuthGroup: false,
      isPublicRoute: false,
    }),
    "/entry",
  ));
test("signed-out visitors reach the welcome and entry screens without redirect", () =>
  assert.equal(
    protectedRouteFor("signed_out", {
      inAuthGroup: false,
      isPublicRoute: true,
    }),
    null,
  ));
test("complete users leave auth for discovery", () =>
  assert.equal(
    protectedRouteFor("ready", { inAuthGroup: true, isPublicRoute: true }),
    "/match/discover",
  ));
test("entering demo mode requires no backend session", () =>
  assert.deepEqual(
    authReducer(initialAuthState, { type: "ENTERED_DEMO_MODE" }),
    {
      ...initialAuthState,
      status: "demo",
    },
  ));
test("demo mode is never redirected to sign-in", () =>
  assert.equal(
    protectedRouteFor("demo", { inAuthGroup: false, isPublicRoute: false }),
    null,
  ));
test("demo mode leaves the auth screens for the welcome screen, not discovery", () =>
  assert.equal(
    protectedRouteFor("demo", { inAuthGroup: true, isPublicRoute: true }),
    "/",
  ));

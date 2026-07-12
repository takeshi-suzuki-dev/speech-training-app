// Registers the jest-dom matchers and unmounts components between tests, so a
// leftover render cannot be found by the next test's queries.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

import { expect, test } from "@playwright/test";

test.describe("Monaco Editor", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
	});

	test("loads editor and displays file content", async ({ page }) => {
		// Open a file
		await page.click("text=src");
		await page.click("text=components");
		await page.click("text=file-monaco-editor.tsx");

		// Check if editor loaded
		await expect(page.locator(".monaco-editor")).toBeVisible();

		// Check if file content is displayed
		await expect(page.locator(".monaco-editor")).toContainText("import");
	});

	test("switches themes", async ({ page }) => {
		// Open theme selector
		await page.click("role=combobox");

		// Select a theme
		await page.click("text=OneDark-Pro");

		// Verify theme was applied
		await expect(page.locator(".monaco-editor")).toHaveClass(/vs-dark/);
	});

	test("handles edit mode", async ({ page }) => {
		// Open a file
		await page.click("text=src");
		await page.click("text=components");
		await page.click("text=file-monaco-editor.tsx");

		// Enter edit mode
		await page.click("text=Edit");

		// Type some content
		await page.keyboard.type("// Test comment");

		// Save changes
		await page.click("text=Save");

		// Verify content was saved
		await expect(page.locator(".monaco-editor")).toContainText(
			"// Test comment",
		);
	});

	test("displays git diff", async ({ page }) => {
		// Open a modified file
		await page.click("text=Modified Files");
		await page.click("text=file-monaco-editor.tsx");

		// Show diff view
		await page.click("text=Show Diff");

		// Verify diff view is displayed
		await expect(page.locator(".monaco-diff-editor")).toBeVisible();
	});

	test("handles image files", async ({ page }) => {
		// Open an image file
		await page.click("text=assets");
		await page.click("text=logo.png");

		// Verify image viewer is displayed instead of editor
		await expect(page.locator("img")).toBeVisible();
		await expect(page.locator(".monaco-editor")).not.toBeVisible();
	});
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { copy } from "../../../lib/copy";
import { MatrixButton } from "../MatrixButton.jsx";

it("invokes onClick when activated", async () => {
  const label = copy("usage.button.refresh");
  const onClick = vi.fn();
  const user = userEvent.setup();
  render(<MatrixButton onClick={onClick}>{label}</MatrixButton>);

  await user.click(screen.getByRole("button", { name: label }));

  expect(onClick).toHaveBeenCalledTimes(1);
});

it("respects disabled state", async () => {
  const label = copy("usage.button.refresh");
  const onClick = vi.fn();
  const user = userEvent.setup();
  render(
    <MatrixButton onClick={onClick} disabled>
      {label}
    </MatrixButton>
  );

  const button = screen.getByRole("button", { name: label });
  expect(button).toBeDisabled();
  await user.click(button);
  expect(onClick).not.toHaveBeenCalled();
});

it("defaults to type=button", () => {
  const label = copy("usage.button.refresh");
  render(<MatrixButton>{label}</MatrixButton>);
  const button = screen.getByRole("button", { name: label });
  expect(button).toHaveAttribute("type", "button");
});

it("sets aria-disabled and ignores clicks when rendered as a link with disabled", async () => {
  const label = copy("usage.button.refresh");
  const onClick = vi.fn();
  const user = userEvent.setup();
  render(
    <MatrixButton as="a" href="#refresh" onClick={onClick} disabled>
      {label}
    </MatrixButton>
  );

  const link = screen.getByRole("link", { name: label });
  expect(link).toHaveAttribute("aria-disabled", "true");
  await user.click(link);
  expect(onClick).not.toHaveBeenCalled();
});

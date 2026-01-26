import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MatrixButton } from "../MatrixButton.jsx";

it("invokes onClick when activated", async () => {
  const onClick = vi.fn();
  const user = userEvent.setup();
  render(<MatrixButton onClick={onClick}>Run</MatrixButton>);

  await user.click(screen.getByRole("button", { name: "Run" }));

  expect(onClick).toHaveBeenCalledTimes(1);
});

it("respects disabled state", async () => {
  const onClick = vi.fn();
  const user = userEvent.setup();
  render(
    <MatrixButton onClick={onClick} disabled>
      Run
    </MatrixButton>
  );

  const button = screen.getByRole("button", { name: "Run" });
  expect(button).toBeDisabled();
  await user.click(button);
  expect(onClick).not.toHaveBeenCalled();
});

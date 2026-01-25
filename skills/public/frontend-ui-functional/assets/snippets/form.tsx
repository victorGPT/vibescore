import { useId, type FormEvent } from "react";

export type SimpleFormProps = {
  label: string;
  placeholder?: string;
  submitLabel: string;
  onSubmit: (value: string) => void;
};

export function SimpleForm({
  label,
  placeholder,
  submitLabel,
  onSubmit,
}: SimpleFormProps) {
  const inputId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = String(data.get("value") ?? "");
    onSubmit(value);
  }

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-primary" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        name="value"
        type="text"
        className="w-full rounded-md border border-subtle bg-surface px-3 py-2 text-sm text-primary"
        placeholder={placeholder}
      />
      <button
        type="submit"
        className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-on-accent"
      >
        {submitLabel}
      </button>
    </form>
  );
}

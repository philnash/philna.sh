export function disableButtonAfterSubmit(form: HTMLFormElement) {
  form.addEventListener("submit", (event) => {
    const submitButton = form.querySelector('button[type="submit"]');
    const submitting = submitButton?.getAttribute("data-loading") === "true";
    const loadingText = form.querySelector(
      'button[type="submit"] .btn-submit-loading'
    ) as HTMLElement | undefined;
    console.log({ submitButton, submitting, loadingText });
    if (!submitting) {
      submitButton?.setAttribute("data-loading", "true");
      console.log(loadingText?.dataset);
      if (loadingText) {
        loadingText.textContent = loadingText.dataset["loadingMsg"] || "";
      }
    } else {
      event.preventDefault();
    }
  });
}

const form = document.querySelector(".contact form") as HTMLFormElement | null;
if (form) {
  disableButtonAfterSubmit(form);
}

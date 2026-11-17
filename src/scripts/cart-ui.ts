import { actions, isInputError } from "astro:actions";
import type { TCart } from "../types/cart";

/**
 * Client behaviour shared by every "Add to cart" form
 * (`form[data-add-to-cart][data-book-id]`): states, request, notices.
 *
 *  default  -> "Add to cart"
 *  loading  -> "Adding to cart" + preloader
 *  added    -> "View cart" (click goes to /cart)
 */
type State = "default" | "loading" | "added";

const LABELS: Record<State, string> = {
  default: "Add to cart",
  loading: "Adding to cart",
  added: "View cart",
};

let cart: TCart | null = null;

const forms = () =>
  document.querySelectorAll<HTMLFormElement>("form[data-add-to-cart]");

function setState(form: HTMLFormElement, state: State) {
  const btn = form.querySelector<HTMLButtonElement>("[data-add-btn]");
  if (!btn || btn.dataset.soldOut !== undefined) return;
  btn.dataset.state = state;
  btn.disabled = state === "loading";
  btn.setAttribute("aria-busy", String(state === "loading"));
  const label = btn.querySelector(".label");
  if (label) label.textContent = LABELS[state];
}

function sync() {
  forms().forEach((form) => {
    const btn = form.querySelector<HTMLButtonElement>("[data-add-btn]");
    // another form's request is still in flight: leave its spinner alone
    if (btn?.dataset.state === "loading") return;
    const inCart = !!cart?.items.some(
      (item) => item.book_id === form.dataset.bookId,
    );
    setState(form, inCart ? "added" : "default");
  });
}

function showNotice(text: string) {
  const zone = document.querySelector<HTMLElement>("[data-notices]");
  if (!zone) return alert(text);
  const el = document.createElement("div");
  el.className = "ui-notice error";
  el.setAttribute("role", "alert");
  el.textContent = text;
  zone.replaceChildren(el);
  el.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

document.addEventListener("submit", async (e) => {
  const form = (e.target as HTMLElement).closest<HTMLFormElement>(
    "form[data-add-to-cart]",
  );
  if (!form) return;
  e.preventDefault();

  const btn = form.querySelector<HTMLButtonElement>("[data-add-btn]");
  if (!btn || btn.dataset.state === "loading") return;
  if (btn.dataset.state === "added") {
    window.location.href = "/cart";
    return;
  }

  document.querySelector("[data-notices]")?.replaceChildren();
  setState(form, "loading");
  const { data, error } = await actions.cart.add(new FormData(form));

  if (error) {
    setState(form, "default");
    showNotice(
      isInputError(error)
        ? Object.values(error.fields).flat().join(" ")
        : error.message,
    );
    return;
  }
  // `cart:updated` re-syncs every button (this one becomes "View cart")
  setState(form, "default");
  window.dispatchEvent(new CustomEvent("cart:updated", { detail: data }));
});

window.addEventListener("cart:updated", (e) => {
  cart = (e as CustomEvent<TCart>).detail;
  sync();
});

// Initial state: which books are already in the visitor's cart
if (forms().length) {
  actions.cart.get().then(({ data }) => {
    if (data) {
      cart = data;
      sync();
    }
  });
}

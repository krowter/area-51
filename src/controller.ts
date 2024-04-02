import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { controllerCensorOption } from "./symbols";

@customElement('a51-controller')
export class A51Controller extends LitElement {
    firstUpdated(): void {
        window[controllerCensorOption] = 'black-out'
    }
    private handleChange(e: FormDataEvent) {
        if (!(e.currentTarget instanceof HTMLFormElement)) return;
        const censorOption = new FormData(e.currentTarget).get('censor-option')

        if (censorOption === 'blur' || censorOption === 'black-out') {
            window[controllerCensorOption] = censorOption
        }
    }
    render() {
        return html`
            <form @change=${this.handleChange}>
                <label>
                    <input type="radio" name="censor-option" value="black-out" checked="checked" />
                    Black out
                </label>
                <label>
                    <input type="radio" name="censor-option" value="blur" />
                    Blur
                </label>
            </form>
        `
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'a51-controller': A51Controller
    }
}
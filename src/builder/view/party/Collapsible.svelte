<script lang="ts">
    export let open: boolean;
</script>

<details {open} on:toggle>
    <summary>
        <slot name="title" />
        <div class="collapser">
            <div class="handle" />
        </div>
    </summary>
    <slot name="content" />
</details>

<style scoped>
    details > summary {
        outline: none;
        display: flex !important;
        align-items: center;
        justify-content: space-between;
        gap: 0.25rem;
        list-style: none !important;
        list-style-type: none !important;
        min-height: 1rem;
        border-top-left-radius: 0.1rem;
        border-top-right-radius: 0.1rem;
        cursor: pointer;
        position: relative;

        margin-bottom: 1rem;
    }

    details > summary::-webkit-details-marker,
    details > summary::marker {
        display: none !important;
    }

    details > summary > .collapser {
        position: relative;
        display: flex;
        align-items: center;
    }

    details > summary .collapser > .handle {
        transform: rotate(0deg);
        transition: transform 0.25s;
        background-color: currentColor;
        -webkit-mask-repeat: no-repeat;
        mask-repeat: no-repeat;
        -webkit-mask-size: contain;
        mask-size: contain;
        -webkit-mask-image: var(--admonition-details-icon);
        mask-image: var(--admonition-details-icon);
        width: 20px;
        height: 20px;
    }

    details[open] > summary .collapser > .handle {
        transform: rotate(90deg);
    }
    details > summary {
        border-bottom: 1px solid var(--background-modifier-border);
    }
    details > summary {
        border-bottom: 1px solid var(--background-modifier-border);
    }
</style>

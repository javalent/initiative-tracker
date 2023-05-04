<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { Filter } from "./filter";

    const dispatch = createEventDispatcher<{
        update: Filter[];
        cancel: null;
        reset: null;
    }>();

    export let filters: Filter[];
</script>

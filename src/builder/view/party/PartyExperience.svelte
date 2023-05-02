<script lang="ts">
    import Experience from "./Experience.svelte";
    import Party from "./Party.svelte";
</script>

<div class="player-component-container">
    <div class="players-xp">
        <Party />
        <Experience />
    </div>
</div>

<style scoped>
    .players-xp {
        display: grid;
        grid-template-columns: 1fr 1fr;
    }
</style>

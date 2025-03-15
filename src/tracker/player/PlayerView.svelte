<script lang="ts">
    import type { Creature } from "src/utils/creature";
    import { tracker } from "../stores/tracker";
    import { onMount, tick } from "svelte";
    import { scale } from "svelte/transition";
    import { linear } from 'svelte/easing';

    const { state, ordered } = tracker;

    function splitString(input) {
    const match = input.match(/^(.*) (\d+)$/);
    if (match) {
        return parseInt(match[2], 10)
    }
    return 0;
}
    
    const getHpStatus = (hp: number, max: number) => {
        if (hp <= 0) return "defeated";  // Check defeated first
        if (hp < max * 0.2) return "near-death"; // Less than 20% HP
        if (hp < max * 0.5) return "bloodied";  // Less than 50% HP
        if (hp < max * 0.75) return "bruised";  // Less than 75% HP
        return "healthy";  // 75% or more HP
    };

    const amIActive = (creature: Creature) => {
        if (creature.hidden) return false;
        if (creature.active) return true;

        const active = $ordered.findIndex((c) => c.active);
        const index = $ordered.indexOf(creature);
        if (active == -1 || active < index) return false;

        const remaining = $ordered.slice(index + 1, active + 1);
        return remaining.every((c) => c.hidden);
    };

    $: activeAndVisible = $ordered.filter((c) => c.enabled && !c.hidden).map((c) => {
        c.count = splitString(c.getName())
        return c
    });

     // Scroll into view when $state changes
     $: if ($ordered) {
        console.log("change!")
        scrollToActive();
    }

    let carousel: HTMLElement | null = null;

    const scrollToActive = async () => {
        await tick(); // Ensure DOM updates before scrolling
        const activeElement = carousel.querySelector(".card.active");
        console.log("scroll!", activeElement)
        if (activeElement) {
            activeElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
    };

    onMount(scrollToActive);
</script>

<div class="view">
  <div bind:this={carousel} class="carousel">
    {#each activeAndVisible as creature (creature.id)}
        <div class="card {amIActive(creature) && $state ? 'active' : ''} {getHpStatus(creature.hp, creature.max)} count-{creature.count}" transition:scale={{ duration: 250, easing: linear }}>
        <div class="img-container {getHpStatus(creature.hp, creature.max)}">
            <img src={creature.image} alt={creature.getName()} />
        </div>
        <h3>{creature.getName()}</h3>
        <p class="status">{[...creature.status].map((s) => s.name).join(", ")}</p>
      </div>
    {/each}
  </div>
</div>

<style scoped>
    .view {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
    }
    .carousel {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        overflow-x: auto;
        gap: 1rem;
        padding: 1rem;
        scroll-behavior: smooth;
        padding-top: 10%
    }
    .card {
        width: 100%;
        min-width: 300px;
        max-width: 400px;
        background: #222;
        color: white;
        border-radius: 10px;
        padding: 0;
        text-align: center;
        box-shadow: 0px 2px 10px rgba(255, 255, 255, 0.1);
        transition: transform 0.3s ease, margin-bottom 0.3s ease;
    }
    .card h3 {
        color: var(--accent);
        padding-left: 10px;
    }
    .card.active {
        margin-bottom: 10%;
        transform: scale(1.15);
        box-shadow: 3px 10px 15px rgba(255, 255, 255, 0.3);
        border-style: solid;
        border-color: whitesmoke;
        border-width: 1px;
        padding: 1px;
        margin-left: 2rem;
        margin-right: 2rem;
    }
    .card.count-1 {
        border-top-style: solid;
        border-top-width: 30px;
        border-top-color: #FFA500;
    }
    .card.count-2 {
        border-top-style: solid;
        border-top-width: 30px;
        border-top-color: #3B82F6;
    }
    .card.count-3 {
        border-top-style: solid;
        border-top-width: 30px;
        border-top-color: #FF69B4;
    }
    .card.count-4 {
        border-top-style: solid;
        border-top-width: 30px;
        border-top-color: #4CAF50;
    }
    .card.count-5 {
        border-top-style: solid;
        border-top-width: 30px;
        border-top-color: #FFD700;
    }
    .card.defeated {
        opacity: 0.5;
        filter: grayscale(100%);
    }
    .img-container {
        position: relative;
        display: inline-block;
    }
    .img-container::before {
        position: absolute;
        content: "";
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
    .img-container.bruised::before {
        background: linear-gradient(to top, rgba(255, 0, 0, 0.5), rgba(255, 0, 0, 0), rgba(255, 0, 0, 0), rgba(255, 0, 0, 0));
    }
    .img-container.bloodied::before {
        background: linear-gradient(to top, rgba(255, 0, 0, 0.6), rgba(255, 0, 0, 0.5), rgba(255, 0, 0, 0), rgba(255, 0, 0, 0));
    }
    .img-container.near-death::before {
        background: linear-gradient(to top, rgba(255, 0, 0, 1), rgba(255, 0, 0, 0.8), rgba(255, 0, 0, 0.5), rgba(255, 0, 0, 0.4));
    }
    .card img {
        width: 100%;
        height: auto;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        border-radius: 5px;
    }
    .status {
        margin-top: 0.5rem;
        font-size: 1.2rem;
        opacity: 0.9;
        color: whitesmoke;
        min-height: 100px;
    }
</style>

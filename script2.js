const pokedex = document.getElementById("pokedex");
const campoPesquisa = document.getElementById("campoPesquisa");
const botaoFavoritos = document.getElementById("botaoFavoritos");
const botaoFiltro = document.getElementById("botaoFiltro");
const menuFiltro = document.getElementById("menuFiltro");
const pokemonSelecionado = document.getElementById("pokemonSelecionado");
const contadorPokemon = document.getElementById("contadorPokemon");

let todosPokemon = [];
let mostrandoFavoritos = false;
let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

async function carregarPokemon() {
    try {
        contadorPokemon.textContent = "Carregando Pokémon...";

        const resposta = await fetch("https://pokeapi.co/api/v2/pokemon?limit=24");
        const dados = await resposta.json();

        const detalhes = await Promise.all(
            dados.results.map(async pokemon => {
                const respostaPokemon = await fetch(pokemon.url);
                return await respostaPokemon.json();
            })
        );

        todosPokemon = detalhes;
        contadorPokemon.textContent = `${todosPokemon.length} Pokémon`;
        exibirPokemon(todosPokemon);

        const pikachu = todosPokemon.find(pokemon => pokemon.id === 25);
        if (pikachu) {
            selecionarPokemon(pikachu);
        }

    } catch (erro) {
        console.error("Erro ao carregar Pokémon:", erro);
        contadorPokemon.textContent = "Erro ao carregar Pokémon";
    }
}

function exibirPokemon(lista) {
    pokedex.innerHTML = "";

    if (lista.length === 0) {
        pokedex.innerHTML = `
            <div class="mensagem-inicial">
                Nenhum Pokémon encontrado.
            </div>
        `;
        contadorPokemon.textContent = "Nenhum resultado";
        return;
    }

    contadorPokemon.textContent = `${lista.length} Pokémon`;

    lista.forEach(pokemon => {
        criarPokemon(pokemon);
    });
}

function criarPokemon(pokemon) {
    const card = document.createElement("article");
    card.classList.add("pokemon");

    const numero = String(pokemon.id).padStart(3, "0");
    const nome = pokemon.name;
    const imagem = pokemon.sprites.other["official-artwork"].front_default;
    const estaFavoritado = favoritos.includes(pokemon.id);

    const tipos = pokemon.types.map(tipo => {
        const tipoConvertido = converterTipo(tipo.type.name);
        return `
            <span class="tipo ${tipoConvertido.classe}">
                ${tipoConvertido.nome}
            </span>
        `;
    }).join("");

    card.innerHTML = `
        <div class="pokemon-imagem">
            <span class="numero">#${numero}</span>
            <button class="botao-favoritar-card ${estaFavoritado ? "favoritado" : ""}" title="Favoritar Pokémon">
                ${estaFavoritado ? "★" : "☆"}
            </button>
            <img src="${imagem}" alt="${nome}" loading="lazy">
        </div>
        <h2>${nome}</h2>
        <div class="tipos-card">${tipos}</div>
    `;

    card.addEventListener("click", () => {
        selecionarPokemon(pokemon);
    });

    const botaoFavoritar = card.querySelector(".botao-favoritar-card");
    botaoFavoritar.addEventListener("click", evento => {
        evento.stopPropagation();
        alternarFavorito(pokemon);
    });

    pokedex.appendChild(card);
}

function selecionarPokemon(pokemon) {
    const numero = String(pokemon.id).padStart(3, "0");
    const imagem = pokemon.sprites.other["official-artwork"].front_default;
    const nome = pokemon.name;
    const estaFavoritado = favoritos.includes(pokemon.id);

    const tipos = pokemon.types.map(tipo => {
        const tipoConvertido = converterTipo(tipo.type.name);
        return `
            <span class="tipo ${tipoConvertido.classe}">
                ${tipoConvertido.nome}
            </span>
        `;
    }).join("");

    pokemonSelecionado.innerHTML = `
        <div class="destaque">
            <div class="destaque-imagem">
                <span class="destaque-numero">#${numero}</span>
                <button class="botao-favoritar-destaque ${estaFavoritado ? "favoritado" : ""}" title="Favoritar Pokémon">
                    ${estaFavoritado ? "★" : "☆"}
                </button>
                <img src="${imagem}" alt="${nome}">
            </div>
            <h2>${nome}</h2>
            <div class="destaque-tipo">${tipos}</div>
            <h3 class="stats-titulo">Base Stats</h3>
            ${criarStats(pokemon)}
        </div>
    `;

    const btnDestaque = pokemonSelecionado.querySelector(".botao-favoritar-destaque");
    if (btnDestaque) {
        btnDestaque.addEventListener("click", () => {
            alternarFavorito(pokemon);
        });
    }
}

function criarStats(pokemon) {
    const nomes = {
        hp: "HP",
        attack: "Attack",
        defense: "Defense",
        "special-attack": "Sp. Atk",
        "special-defense": "Sp. Def",
        speed: "Speed"
    };

    return pokemon.stats.map(stat => {
        const valor = stat.base_stat;
        const porcentagem = Math.min(valor, 150) / 150 * 100;

        return `
            <div class="stat">
                <span class="stat-nome">${nomes[stat.stat.name]}</span>
                <span class="stat-valor">${valor}</span>
                <div class="barra">
                    <div style="width: ${porcentagem}%"></div>
                </div>
            </div>
        `;
    }).join("");
}

function alternarFavorito(pokemon) {
    const indice = favoritos.indexOf(pokemon.id);

    if (indice === -1) {
        favoritos.push(pokemon.id);
    } else {
        favoritos.splice(indice, 1);
    }

    localStorage.setItem("favoritos", JSON.stringify(favoritos));

    if (mostrandoFavoritos) {
        mostrarFavoritos();
    } else {
        const listaAtual = todosPokemon.filter(pokemonAtual => !favoritos.includes(pokemonAtual.id));
        exibirPokemon(listaAtual);
    }

    selecionarPokemon(pokemon);
}

function mostrarFavoritos() {
    mostrandoFavoritos = true;
    const lista = todosPokemon.filter(pokemon => favoritos.includes(pokemon.id));
    exibirPokemon(lista);
    botaoFavoritos.textContent = "★";

    if (lista.length > 0) {
        selecionarPokemon(lista[0]);
    }
}

function mostrarTodos() {
    mostrandoFavoritos = false;
    exibirPokemon(todosPokemon);
    botaoFavoritos.textContent = "☆";
}

function pesquisarPokemon() {
    const pesquisa = campoPesquisa.value.toLowerCase().trim().replace("#", "");

    if (pesquisa === "") {
        mostrarTodos();
        return;
    }

    mostrandoFavoritos = false;

    const resultados = todosPokemon.filter(pokemon => {
        if (favoritos.includes(pokemon.id)) {
            return false;
        }

        const nome = pokemon.name.toLowerCase();
        const numero = String(pokemon.id);

        return nome.includes(pesquisa) || numero === pesquisa;
    });

    exibirPokemon(resultados);

    if (resultados.length > 0) {
        selecionarPokemon(resultados[0]);
    }
}

function filtrarPorTipo(tipo) {
    mostrandoFavoritos = false;
    let resultados;

    if (tipo === "todos") {
        resultados = todosPokemon.filter(pokemon => !favoritos.includes(pokemon.id));
    } else {
        resultados = todosPokemon.filter(pokemon => {
            if (favoritos.includes(pokemon.id)) {
                return false;
            }
            return pokemon.types.some(tipoPokemon => tipoPokemon.type.name === tipo);
        });
    }

    exibirPokemon(resultados);

    if (resultados.length > 0) {
        selecionarPokemon(resultados[0]);
    }

    menuFiltro.classList.remove("aberto");
}

function converterTipo(tipo) {
    const tipos = {
        normal: { nome: "NORMAL", classe: "normal" },
        fire: { nome: "FOGO", classe: "fogo" },
        water: { nome: "ÁGUA", classe: "agua" },
        electric: { nome: "ELÉTRICO", classe: "eletrico" },
        grass: { nome: "PLANTA", classe: "grama" },
        ice: { nome: "GELO", classe: "gelo" },
        fighting: { nome: "LUTADOR", classe: "lutador" },
        poison: { nome: "VENENO", classe: "veneno" },
        ground: { nome: "TERRA", classe: "terra" },
        flying: { nome: "VOADOR", classe: "voador" },
        psychic: { nome: "PSÍQUICO", classe: "psiquico" },
        bug: { nome: "INSETO", classe: "inseto" },
        rock: { nome: "PEDRA", classe: "pedra" },
        ghost: { nome: "FANTASMA", classe: "fantasma" },
        dragon: { nome: "DRAGÃO", classe: "dragao" },
        dark: { nome: "NOTURNO", classe: "noturno" },
        steel: { nome: "AÇO", classe: "aco" },
        fairy: { nome: "FADA", classe: "fada" }
    };
    return tipos[tipo];
}

botaoFiltro.addEventListener("click", () => {
    menuFiltro.classList.toggle("aberto");
});

const botoesTipo = document.querySelectorAll("#menuFiltro button[data-tipo]");
botoesTipo.forEach(botao => {
    botao.addEventListener("click", () => {
        const tipo = botao.getAttribute("data-tipo");
        filtrarPorTipo(tipo);
    });
});


botaoFavoritos.addEventListener("click", () => {
    if (mostrandoFavoritos) {
        mostrarTodos();
    } else {
        mostrarFavoritos();
    }
});

campoPesquisa.addEventListener("input", pesquisarPokemon);

campoPesquisa.addEventListener("keydown", evento => {
    if (evento.key === "Enter") {
        pesquisarPokemon();
    }
});

carregarPokemon();

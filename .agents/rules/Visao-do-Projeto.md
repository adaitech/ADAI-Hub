---
description: Propósito, princípio central e visão do novo ecossistema digital da ADAI — filtro de todas as decisões
alwaysApply: true
---

# Visão do Projeto — ADAI Hub

**Documento oficial de referência funcional.** Toda página, componente, integração ou conteúdo deve ser justificável por este documento.

---

## Objetivo do Projeto

Criar o novo ecossistema digital da ADAI, desenvolvendo um site moderno, relevante e escalável, capaz de se tornar uma referência de presença digital para igrejas cristãs no Brasil, traduzindo para o ambiente online a identidade, a visão, a cultura e aquilo que Deus tem realizado através da igreja.

O projeto terá como referência experiências digitais de igrejas internacionais, como a Passion City Church, porém será desenvolvido com identidade própria da ADAI, respeitando nossa realidade, linguagem, cultura e forma de comunicar com o público brasileiro.

Mais do que um site institucional, a proposta é construir uma plataforma viva e em constante evolução, que conecte pessoas, ministérios, projetos, igrejas e iniciativas da ADAI.

## Princípio central

Todo o projeto deverá estar integralmente alinhado à visão da ADAI:

**Amar a Deus. Servir as pessoas. Influenciar o mundo.**

Essa visão será o principal direcionador de todas as decisões do projeto.

Nenhuma página, funcionalidade, conteúdo, integração, experiência digital ou iniciativa deverá ser criada apenas porque é moderna, visualmente interessante ou tecnologicamente possível.

Se algo não contribuir para Amar a Deus, Servir as Pessoas ou Influenciar o Mundo, não deverá fazer parte da plataforma.

Tecnologia, design e inovação serão ferramentas para potencializar a visão da igreja, e nunca um fim em si mesmos.

## O novo site deverá

- Apresentar de maneira clara e moderna a ADAI, sua visão, história, valores, unidades e liderança.
- Comunicar de forma evidente a visão Amar a Deus, Servir as Pessoas e Influenciar o Mundo, permitindo que ela seja percebida em toda a experiência digital.
- Centralizar todos os ministérios da igreja, permitindo que cada ministério tenha seu próprio espaço para apresentar propósito, liderança, agenda, conteúdos, formas de participação e projetos.
- Permitir que cada ministério demonstre claramente como sua atuação contribui para a visão da ADAI.
- Dar visibilidade aos projetos sociais, missionários, ministeriais e iniciativas especiais desenvolvidos pela igreja.
- Possuir uma arquitetura preparada para crescimento, permitindo a criação de novas páginas, projetos, campanhas e experiências sem necessidade constante de desenvolvimento técnico.
- Utilizar o Strapi como CMS, permitindo que os próprios ministérios e o time Criativo da ADAI mantenham conteúdos, imagens, páginas, agendas, projetos e informações atualizadas com autonomia.
- Estabelecer uma estrutura de governança de conteúdo para garantir que, mesmo com diferentes ministérios publicando informações, toda comunicação permaneça alinhada à identidade, linguagem, princípios e visão da ADAI.
- Criar experiências que aproximem pessoas da igreja, facilitando ações como conhecer a ADAI, encontrar uma unidade, participar de ministérios, acompanhar eventos, assistir conteúdos e dar o próximo passo.
- Desenvolver uma área voltada para outras igrejas e lideranças cristãs, permitindo compartilhar conhecimento, conteúdos, ferramentas, projetos e iniciativas que possam servir ao Reino além das paredes da ADAI.
- Integrar e dar destaque ao Connect, criando um ambiente digital capaz de conectar líderes, pastores, igrejas, conteúdos e projetos.
- Estruturar uma plataforma preparada para futuras integrações, conteúdos personalizados, experiências interativas e novas iniciativas digitais da igreja.

## Visão da experiência

O novo site deverá transformar a presença digital da ADAI em uma extensão daquilo que a igreja já vive presencialmente.

Quem acessar a plataforma deverá conseguir entender:

- Quem somos.
- No que acreditamos.
- O que Deus está fazendo através da ADAI.
- Como posso fazer parte.
- Como posso servir.
- Como posso crescer.
- Como posso contribuir para impactar outras pessoas.

## Visão de futuro

O objetivo final é que o site deixe de ser apenas um local para encontrar informações sobre a ADAI e se torne uma porta de entrada digital para tudo o que acontece na igreja.

Uma plataforma capaz de comunicar o Evangelho, conectar pessoas, fortalecer ministérios, apoiar outras igrejas e ampliar o impacto da ADAI no Brasil e, futuramente, além dele.

Queremos construir não apenas o novo site da ADAI, mas uma referência de como uma igreja pode utilizar tecnologia, design, conteúdo e inovação a serviço de sua visão.

E toda evolução da plataforma deverá partir da mesma pergunta:

> **Isso nos ajuda a Amar a Deus, Servir as Pessoas e Influenciar o Mundo?**
>
> Se a resposta for não, não faz parte do projeto.

---

## Como este documento se traduz em regras técnicas

| Diretriz da visão | Consequência técnica (ver regra) |
| --- | --- |
| Criar páginas, projetos e campanhas **sem desenvolvimento constante** | Páginas montadas no Strapi empilhando seções reutilizáveis — `Componentes-e-CMS.md` |
| Cada **ministério tem seu espaço** | Ministério é um content type; a página dele usa as mesmas seções da Home — `Componentes-e-CMS.md` |
| **Governança de conteúdo** com vários ministérios publicando | Campos do CMS com escolhas semânticas (select), sem cor livre nem HTML livre; identidade garantida pelo código — `Componentes-e-CMS.md` §Governança |
| Aproximar pessoas, **facilitar o próximo passo** | CTAs claros, a11y WCAG 2.2 AA, performance mobile — `Arquitetura-e-Governanca.md`, `Definition-of-Done.md` |
| **Plataforma viva** e preparada para o futuro | Componentes isolados, documentados e visíveis na vitrine — `Vitrine-de-Componentes.md` |
| Tecnologia **nunca como fim em si** | Sem bibliotecas de efeito visual sem propósito — `Stack-Fontes-e-Bibliotecas.md` |

## Regras de uso para IA

- Não assumir regras de produto implícitas nem inventar comportamentos.
- Não extrapolar escopo: se uma funcionalidade não é pedida nem está aqui, perguntar.
- Diante de uma proposta "legal mas sem propósito" (efeito, animação, integração), aplicar a pergunta-filtro e, na dúvida, perguntar ao time.

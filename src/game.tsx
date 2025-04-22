import { useState } from "react";
import {
  Card,
  CardRank,
  CardDeck,
  CardSuit,
  GameState,
  Hand,
  GameResult,
} from "./types";

//UI Elements
const CardBackImage = () => (
  <img src={process.env.PUBLIC_URL + `/SVG-cards/png/1x/back.png`} />
);

const CardImage = ({ suit, rank }: Card) => {
  const card = rank === CardRank.Ace ? 1 : rank;
  return (
    <img
      src={
        process.env.PUBLIC_URL +
        `/SVG-cards/png/1x/${suit.slice(0, -1)}_${card}.png`
      }
    />
  );
};

//Setup
const newCardDeck = (): CardDeck =>
  Object.values(CardSuit)
    .map((suit) =>
      Object.values(CardRank).map((rank) => ({
        suit,
        rank,
      }))
    )
    .reduce((a, v) => [...a, ...v]);

const shuffle = (deck: CardDeck): CardDeck => {
  return deck.sort(() => Math.random() - 0.5);
};

const takeCard = (deck: CardDeck): { card: Card; remaining: CardDeck } => {
  const card = deck[deck.length - 1];
  const remaining = deck.slice(0, deck.length - 1);
  return { card, remaining };
};

const setupGame = (): GameState => {
  const cardDeck = shuffle(newCardDeck());
  return {
    playerHand: cardDeck.slice(cardDeck.length - 2, cardDeck.length),
    dealerHand: cardDeck.slice(cardDeck.length - 4, cardDeck.length - 2),
    cardDeck: cardDeck.slice(0, cardDeck.length - 4), // remaining cards after player and dealer have been give theirs
    turn: "player_turn",
  };
};

const getRankValue = (rank: CardRank): number => {
  switch (rank) {
    case CardRank.King:
    case CardRank.Queen:
    case CardRank.Jack:
    case CardRank.Ten:
      return 10;
    case CardRank.Nine:
      return 9;
    case CardRank.Eight:
      return 8;
    case CardRank.Seven:
      return 7;
    case CardRank.Six:
      return 6;
    case CardRank.Five:
      return 5;
    case CardRank.Four:
      return 4;
    case CardRank.Three:
      return 3;
    case CardRank.Two:
      return 2;
    case CardRank.Ace:
      return 1; // We'll handle Ace value separately
    default:
      return 0;
  }
};

const calculateHandScore = (hand: Hand): number => {
  let score = 0;
  let aceCount = 0;

  // First, count aces and sum up all other cards
  hand.forEach(card => {
    if (card.rank === CardRank.Ace) {
      aceCount++;
    } else {
      score += getRankValue(card.rank);
    }
  });

  // Add aces one by one, deciding to use 11 or 1
  if (aceCount > 0 && score + 11 + (aceCount - 1) <= 21) {
    score += 11 + (aceCount - 1);
  } else {
    score += aceCount; // All aces count as 1
  }


  return score;
};
const isBlackjack = (hand: Hand): boolean => {
  return hand.length === 2 &&
      hand.some(card => card.rank === CardRank.Ace) &&
      hand.some(card => [CardRank.Ten, CardRank.Jack, CardRank.Queen, CardRank.King].includes(card.rank));
};

const determineGameResult = (state: GameState): GameResult => {
  const playerScore = calculateHandScore(state.playerHand);
  const dealerScore = calculateHandScore(state.dealerHand);
  const playerBlackjack = isBlackjack(state.playerHand);
  const dealerBlackjack = isBlackjack(state.dealerHand);

  // Handle blackjack cases
  if (playerBlackjack && !dealerBlackjack) {
    return "player_win";
  }
  if (dealerBlackjack && !playerBlackjack) {
    return "dealer_win";
  }
  if (playerBlackjack && dealerBlackjack) {
    return "draw";
  }

  // Handle busts
  if(playerScore == dealerScore){
    return "draw";
  }
  if (playerScore > 21) {
    return "dealer_win";
  }
  if (dealerScore > 21) {
    return "player_win";
  }

  // Compare scores
  if (playerScore > dealerScore) {
    return "player_win";
  }
  if (dealerScore > playerScore) {
    return "dealer_win";
  }

  return "draw";
};


//Player Actions
const playerStands = (state: GameState): GameState => {
  const isDealerHit = calculateHandScore(state.dealerHand) <= 16
  return {
    ...state,
    dealerHand: isDealerHit? [...state.dealerHand,takeCard(state.cardDeck).card] : state.dealerHand,
    turn: "dealer_turn",
  };
  };

const playerHits = (state: GameState): GameState => {
  const { card, remaining } = takeCard(state.cardDeck);
  return {
    ...state,
    cardDeck: remaining,
    playerHand: [...state.playerHand, card],
  };
};

//UI Component
const Game = (): JSX.Element => {
  const [state, setState] = useState(setupGame());

  return (
    <>
      <div>
        <p>There are {state.cardDeck.length} cards left in deck</p>
        <button
          disabled={state.turn === "dealer_turn"}
          onClick={(): void => setState(playerHits)}
        >
          Hit
        </button>
        <button
          disabled={state.turn === "dealer_turn"}
          onClick={(): void => setState(playerStands)}
        >
          Stand
        </button>
        <button onClick={(): void => setState(setupGame())}>Reset</button>
      </div>
      <p>Player Cards</p>
      <div>
        {state.playerHand.map(CardImage)}
        <p>Player Score {calculateHandScore(state.playerHand)}</p>
      </div>
      <p>Dealer Cards</p>
      {state.turn === "player_turn" && state.dealerHand.length > 0 ? (
        <div>
          <CardBackImage />
          <CardImage {...state.dealerHand[1]} />
        </div>
      ) : (
        <div>
          {state.dealerHand.map(CardImage)}
          <p>Dealer Score {calculateHandScore(state.dealerHand)}</p>
        </div>
      )}
      {state.turn === "dealer_turn" &&
      determineGameResult(state) != "no_result" ? (
        <p>{determineGameResult(state)}</p>
      ) : (
        <p>{state.turn}</p>
      )}
    </>
  );
};

export {
  Game,
  playerHits,
  playerStands,
  determineGameResult,
  calculateHandScore,
  setupGame,
};

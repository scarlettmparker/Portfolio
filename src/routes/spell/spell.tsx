import { Component, createEffect, createSignal, onMount } from "solid-js";
import styles from './spell.module.css';

/**
 * Load the letters for the game. This will load the file of "acceptable" letters
 * corresponding to the difficulty level of the game. "Acceptable letters" are ones
 * that follow said requirements:
 * 
 * Contains at least 2 vowels
 * Can make at least one pangram (a word that uses all the letters at least once)
 * 
 * Easy: between 8 and 20 words
 * Medium: between 20 and 40 words
 * Hard: between 40 and 60 words
 * Very hard: between 80 and 140 words
 * 
 * @param difficulty Difficulty level of the game
 * @returns Promise<[string[], string]> that resolves to an array of letters and the center letter
 */
async function load_letters(difficulty: number): Promise<[string[], string]> {
  const letters_file = `./assets/spellbee/acceptable_letters_${difficulty}.txt`;

  const letters = fetch(letters_file)
    .then(response => response.text())
    .then(text => {
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const random_line = lines[Math.floor(Math.random() * lines.length)];
      const center_letter = random_line[0];
      const other_letters = random_line.trim().slice(1).split('');

      return [other_letters, center_letter];
    })
    .catch(error => {
      console.error('Error loading letters:', error);
      return [['', '', '', '', '', ''], ''] as [string[], string];
    });

  return letters as Promise<[string[], string]>;
}

type Solutions = {
  solutions: string[];
  formatted_soutions: string[];
  total_points: number;
}

/**
 * Load the solutions for the game. This will load the filtered dictionary file and
 * filter out the words that don't meet the requirements of the game:
 * 
 * Contains the center letter
 * Only uses the letters given
 * 
 * The function also calculates the total points that can be earned in the game.
 * Points are calculated as follows:
 * 
 * 4-letter words: 1 point
 * X-letter words: X points
 * Pangrams: double the points
 * 
 * @param letters Array of letters for the game
 * @param center_letter Center letter for the game
 * @returns Promise<Solutions> that resolves to an object containing the solutions,
 * formatted solutions, and total points
 */
async function load_solutions(letters: string[], center_letter: string): Promise<Solutions> {
  const dictionary_file = './assets/spellbee/dictionary_filtered.txt';
  let solutions: Solutions = { solutions: [], formatted_soutions: [], total_points: 0 };

  try {
    const response = await fetch(dictionary_file);

    // read the response as a stream and wait for it to finish
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let text = '';

    while (!done) {
      const { value, done: doneReading } = await reader!.read();
      done = doneReading;
      text += decoder.decode(value, { stream: true });
    }

    const lines = text.split('\n');
    const all_letters = letters.concat(center_letter);

    for (const line of lines) {
      const [word, formatted_word] = line.split(':');

      // ensure the word contains the center letter and has only the letters given
      if (word.includes(center_letter) && word.split('').every(letter => all_letters.includes(letter))) {
        solutions.solutions.push(word.trim());
        solutions.formatted_soutions.push(formatted_word.trim());

        if (word.length == 4) {
          solutions.total_points += 1;
        } else {
          solutions.total_points += word.length;
          // if the word is a pangram, double the points
          if (is_pangram(word, letters, center_letter)) {
            solutions.total_points += word.length;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading solutions:', error);
  }

  return solutions;
}

/**
 * Check if a word is a pangram. A pangram is a word that uses all the letters at least once.
 * 
 * @param word Word to check
 * @param letters Array of letters for the game
 * @param center_letter Center letter for the game
 * @returns True if the word is a pangram, false otherwise
 */
function is_pangram(word: string, letters: string[], center_letter: string): boolean {
  const all_letters = letters.concat(center_letter);
  return (word.split('').every(_letter => new Set(word).size === all_letters.length));
}

const Spell: Component = () => {
  // User inputted stuff (current guess, words correct, total points)
  const [guess, set_guess] = createSignal('');
  const [words_correct, set_words_correct] = createSignal<string[]>([]);
  const [points, set_points] = createSignal(0);

  const [difficulty, set_difficulty] = createSignal(0);
  const [letters, set_letters] = createSignal(["", "", "", "", "", ""]);
  const [center_letter, set_center_letter] = createSignal("");

  const [solutions, set_solutions] = createSignal<string[]>([]);
  const [formatted_solution, set_formatted_solutions] = createSignal<string[]>([]);
  const [total_points, set_total_points] = createSignal(0);

  // Display nonsense for guessing
  const [display, set_display] = createSignal('');
  const [error, set_error] = createSignal('');

  let guess_box_ref!: HTMLInputElement;
  let timeout_ref!: ReturnType<typeof setTimeout>;

  const keyboard_map: { [key: string]: string } = {
    'a': 'α', 'b': 'β', 'c': 'ψ', 'd': 'δ', 'e': 'ε', 'f': 'φ', 'g': 'γ',
    'h': 'η', 'i': 'ι', 'j': 'ξ', 'k': 'κ', 'l': 'λ', 'm': 'μ', 'n': 'ν',
    'o': 'ο', 'p': 'π', 'r': 'ρ', 's': 'σ', 't': 'τ', 'u': 'θ',
    'v': 'ω', 'w': 'ς', 'x': 'χ', 'y': 'υ', 'z': 'ζ'
  };

  const top_row = () => letters().slice(0, 2);
  const middle_row = () => [letters()[2], center_letter(), letters()[3]];
  const bottom_row = () => letters().slice(4, 6);

  onMount(async () => {
    document.addEventListener("keydown", (e) => do_keyboard_event(e));

    // load the letters for the game
    await load_game_letters();
    await load_game_solutions();

    return () => {
      document.removeEventListener("keydown", (e) => do_keyboard_event(e));
    }
  })

  const load_game_letters = async () => {
    let hex_letters: string[] = [];
    let hex_center: string = '';

    if (localStorage.getItem('center_letter') && localStorage.getItem('letters')) {
      // if the letters are already in local storage, use them
      hex_center = localStorage.getItem('center_letter') as string;
      hex_letters = (localStorage.getItem('letters') as string).split('');
    } else {
      [hex_letters, hex_center] = await load_letters(difficulty());
      // add letters to local storage to be used if refreshed, until won/reset
      localStorage.setItem('center_letter', hex_center);
      localStorage.setItem('letters', hex_letters.join(''));
    }

    set_letters(hex_letters);
    set_center_letter(hex_center);
  }

  // load the solutions for the game along with the points
  const load_game_solutions = async () => {
    const hex_solutions = await load_solutions(letters(), center_letter());
    set_solutions(hex_solutions.solutions);
    set_formatted_solutions(hex_solutions.formatted_soutions);
    set_total_points(hex_solutions.total_points);
  }

  const add_keyboard_letter = (e: KeyboardEvent) => {
    const current_guess = guess();
    const english_keys = /^[a-zA-Z]$/;
    const greek_keys = /^[α-ωΑ-Ω]$/;

    if (greek_keys.test(e.key)) {
      set_guess(current_guess + e.key.toUpperCase());
    } else if (english_keys.test(e.key)) {
      // find the corresponding greek letter
      const char = e.key.toLowerCase();
      const greek_char = keyboard_map[char];
      if (greek_char) {
        set_guess(current_guess + greek_char.toUpperCase());
      }
    }
  }

  // submit the current guess
  const submit_guess = () => {
    const current_guess = guess();
    const current_correct = words_correct();
    set_guess('');

    if (current_guess.length < 4) {
      set_error("Πολύ μικρή λέξη!");
      return;
    } else if (!current_guess.includes(center_letter())) {
      set_error("Λείπει το κεντρικό γράμμα!");
      return;
    }

    if (solutions().includes(current_guess)) {
      // add the word to the list of correct words
      set_words_correct([...current_correct, current_guess]);
      set_points(points() + current_guess.length);

      if (is_pangram(current_guess, letters(), center_letter())) {
        set_points(points() + current_guess.length);
        set_display("Παντόγραμμα!");
      } else {
        // update the display based on the length of the word
        switch (current_guess.length) {
          case 4:
            set_display("Σωστα!");
            break;
          case 5:
            set_display("Ωραία!");
            break;
          case 6:
            set_display("Καταπληκτικά!");
            break;
          default:
            set_display("Τέλεια!");
            break;
        }
      }
    } else {
      set_error("Μη αποδεκτή λέξη!");
    }

    if (timeout_ref) {
      clearTimeout(timeout_ref);
    } 

    // clear the display after a bit
    timeout_ref = setTimeout(() => {
      set_display('');
      set_error('');
    }, 4000); // 4 seconds
  }

  const do_keyboard_event = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      return;
    }

    // prevent default behaviour so keys don't get typed without checks first
    e.preventDefault();
    guess_box_ref.focus();
    const current_guess = guess();

    if (e.key === "Backspace") {
      set_guess(current_guess.slice(0, -1));
    } else if (e.key === "Enter") {
      submit_guess();
    } else {
      add_keyboard_letter(e);
    }
  }

  const add_hex_letter = (letter: string) => {
    const current_guess = guess();
    set_guess(current_guess + letter.toUpperCase());
  }

  return (
    <div class={styles.spell_bee_wrapper}>
      {display() &&
        <div class={styles.display}>{display()}</div>
      }
      {error() &&
        <div class={styles.error}>{error()}</div>
      }
      <div class={styles.answer}>
        <input class={styles.answer_box} type="text" value={guess()} ref={guess_box_ref} />
      </div>
      <div class={styles.spell_bee_row}>
        {top_row().map(letter => (
          <div class={styles.hex} onclick={() => add_hex_letter(letter)}>
            {letter}
          </div>
        ))}
      </div>
      <div class={styles.spell_bee_row}>
        {middle_row().map(letter => (
          <div class={styles.hex} onclick={() => add_hex_letter(letter)}>
            {letter}
          </div>
        ))}
      </div>
      <div class={styles.spell_bee_row}>
        {bottom_row().map(letter => (
          <div class={styles.hex} onclick={() => add_hex_letter(letter)}>
            {letter}
          </div>
        ))}
      </div>
    </div>
  )
};

export default Spell;
"""
Helper file to generate list of playable letter combinations
Playable combinations have at least 1 pangram and 16 possible words
This won't generate every single combination, but it will generate a lot
If you wish to run this file, you will need the greek_dictionary_filtered.txt file in the same directory
You will also need to run it on a Linux machine, preferably with multiple cores
"""

import random
import itertools
import multiprocessing
import sys

greek_alphabet = ["Α", "Β", "Γ", "Δ", "Ε", "Ζ", "Η", "Θ", "Ι", "Κ", "Λ", "Μ", "Ν", "Ξ", "Ο", "Π", "Ρ", "Σ", "Τ", "Υ", "Φ", "Χ", "Ψ", "Ω"]
greek_vowels = ["Α", "Ε", "Η", "Ι", "Ο", "Υ", "Ω"]

try:
    # difficulty filter based on dictionary
    difficulty = sys.argv[1]
    if (difficulty != '0' and difficulty != '1' and difficulty != '2'
            and difficulty != '3' and difficulty != '4'):
        print('Invalid difficulty level. Please enter a difficulty level between 0 and 4.')
        sys.exit(0)
except:
    # if user enters nothing
    print('Please enter a difficulty level between 0 and 4.')
    sys.exit(0)

with open(f'acceptable_letters_{difficulty}.txt', 'w', encoding='utf-8') as letters_file:
    letters_file.write('')
    
# load dictionary and create a set of letters for each word
letters_by_word = {}
try:
    # find difficulty specific dictionary
    with open(f'greek_dictionary_filtered_{difficulty}.txt', 'r', encoding='utf-8') as file:
        for line in file:
            word = line.split(':')[0].strip()
            letters_by_word[word] = set(word.upper())
except:
    # if dictionary doesn't exist
    print("Dictionary for specified difficulty doesn't exist! Please run fix_dictionary.py first.")

def generateLetters(letters):
    pangrams = 0
    middle_letter = letters[0]
    # create set and then remove middle letter
    letters_set = set(letter.upper() for letter in letters)
    letters.remove(middle_letter)
    filtered_words = []

    # ensure words contain letters and the middle letter
    for word, word_letters in letters_by_word.items():
        if word_letters.issubset(letters_set) and middle_letter.upper() in word_letters:
            filtered_words.append(word.upper())

    for word in filtered_words:
        # if all 7 letters show up at least once it's a pangram
        if all(letter.upper() in word.upper() for letter in letters) and middle_letter.upper() in word.upper():
            pangrams += 1

    # ensures at least 1 pangram and between 24 and 90 words, so we don't get unplayable letter combinations
    if pangrams >= 1 and 24 <= len(filtered_words) <= 90:
        letters_str = middle_letter + ''.join(letters)
        # print so i can feel good about the program moving along lol
        print("Success! " + letters_str + " has " + str(pangrams) + " pangram(s) and " + str(len(filtered_words)) + " words")
        with open(f'acceptable_letters_{difficulty}.txt', 'a', encoding='utf-8') as file:
            file.write(letters_str + '\n')
    else:
        # clear list from memory
        filtered_words.clear()
        
def process_combination(combination):
    # generate letters with at least 2 vowels minimum (also reduces number of checks and better playability)
    if len([letter for letter in combination if letter in greek_vowels]) >= 2:
        shuffled_combination = list(combination)
        random.shuffle(shuffled_combination)
        generateLetters(shuffled_combination)
        
combinations = list(itertools.combinations(greek_alphabet, 7))

# pooling for multprocessing garbge
with multiprocessing.Pool() as pool:
    pool.map(process_combination, combinations)
    
# close dictionary and letter files
file.close()
letters_file.close()
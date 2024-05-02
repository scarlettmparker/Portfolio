import sys

filtered_words = []
filtered_words_no_tonos = []

try:
    difficulty = sys.argv[1]
    if (difficulty != '0' and difficulty != '1' and difficulty != '2'
            and difficulty != '3' and difficulty != '4'):
        print('Invalid difficulty level. Please enter a difficulty level between 0 and 4.')
        sys.exit(0)
except:
    print('Please enter a difficulty level between 0 and 4.')
    sys.exit(0)

# map accented letters to non accent equivalent
accent_mapping = {
    'ά': 'α', 'έ': 'ε', 'ί': 'ι', 'ύ': 'υ', 'ό': 'ο', 'ώ': 'ω', 'ή': 'η', 
    'ϊ': 'ι', 'ϋ': 'υ', 'ΐ': 'ι', 'ΰ': 'υ'
}

# map difficulty levels to word frequency limits
difficulty_mapping = {
    '0': 4500,
    '1': 2000,
    '2': 750,
    '3': 250,
    '4': 0.2
}

# set word frequency limit based on difficulty
word_freq_limit = difficulty_mapping.get(difficulty, 0)

with open('greek_dictionary.txt', 'r', encoding='UTF-8') as file:
    for line in file:
        word, freq = line.strip().split(' ')
        # find word frequency
        freq = int(freq)
        # infrequent words are not added, otherwise too many words
        if word.islower() and len(word) >= 4 and freq >= word_freq_limit:
            word_no_tonos = ''.join(accent_mapping.get(c, c) for c in word)
            filtered_words.append((word_no_tonos.upper(), word.capitalize()))

# remove duplicates
filtered_words = list(dict(filtered_words).items())

with open(f'greek_dictionary_filtered_{difficulty}.txt', 'w', encoding='UTF-8') as file:
    for word_no_tonos, word in filtered_words:
        # word with no accent : word with accent
        file.write(word_no_tonos + ':' + word + '\n')
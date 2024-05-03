import sys
import pandas as pd

filtered_words = []
filtered_words_no_tonos = []

try:
    difficulty = sys.argv[1]
    if (difficulty != '0' and difficulty != '1'
            and difficulty != '2' and difficulty != '3'):
        print('Invalid difficulty level. Please enter a difficulty level between 0 and 3.')
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
    '0': 3.75,
    '1': 1,
    '2': 0.1,
    '3': 0
}

# set word frequency limit based on difficulty
word_freq_limit = difficulty_mapping.get(difficulty, 0)

# read the Excel file
df = pd.read_excel('greek_dictionary.xlsx')

for index, row in df.iterrows():
    word = row['Word']
    freq = float(row['WordFreq'])
    # infrequent words are not added, otherwise too many words
    if word.islower() and len(word) >= 4 and freq >= word_freq_limit:
        word_no_tonos = ''.join(accent_mapping.get(c, c) for c in word)
        filtered_words.append((word_no_tonos.upper(), word.capitalize()))

# remove duplicates
filtered_words = list(dict(filtered_words).items())

# remove duplicates
filtered_words = list(dict(filtered_words).items())

with open(f'greek_dictionary_filtered_{difficulty}.txt', 'w', encoding='UTF-8') as file:
    for word_no_tonos, word in filtered_words:
        # word with no accent : word with accent
        file.write(word_no_tonos + ':' + word + '\n')
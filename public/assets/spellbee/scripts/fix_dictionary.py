import sys
import pandas as pd

filtered_words = []
filtered_words_no_tonos = []

# map accented letters to non accent equivalent
accent_mapping = {
    'ά': 'α', 'έ': 'ε', 'ί': 'ι', 'ύ': 'υ', 'ό': 'ο', 'ώ': 'ω', 'ή': 'η', 
    'ϊ': 'ι', 'ϋ': 'υ', 'ΐ': 'ι', 'ΰ': 'υ'
}

# read the Excel file
df = pd.read_excel('greek_dictionary.xlsx')

for index, row in df.iterrows():
    word = row['Word']
    # infrequent words are not added, otherwise too many words
    if word.islower() and len(word) >= 4:
        word_no_tonos = ''.join(accent_mapping.get(c, c) for c in word)
        filtered_words.append((word_no_tonos.upper(), word.capitalize()))

# remove duplicates
filtered_words = list(dict(filtered_words).items())

with open(f'greek_dictionary_filtered.txt', 'w', encoding='UTF-8') as file:
    for word_no_tonos, word in filtered_words:
        # word with no accent : word with accent
        file.write(word_no_tonos + ':' + word + '\n')
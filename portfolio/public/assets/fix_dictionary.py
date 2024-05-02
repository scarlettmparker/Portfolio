filtered_words = []
filtered_words_no_tonos = []

accent_mapping = {
    'ά': 'α', 'έ': 'ε', 'ί': 'ι', 'ύ': 'υ', 'ό': 'ο', 'ώ': 'ω', 'ή': 'η', 
    'ϊ': 'ι', 'ϋ': 'υ', 'ΐ': 'ι', 'ΰ': 'υ'
}

with open('greek_dictionary.txt', 'r', encoding='UTF-8') as file:
    for line in file:
        word, freq = line.strip().split(' ')
        freq = int(freq)
        if word.islower() and len(word) >= 4 and freq >= 40:
            filtered_words.append(word.capitalize())
            word_no_tonos = ''.join(accent_mapping.get(c, c) for c in word)
            filtered_words_no_tonos.append(word_no_tonos.upper())

with open('greek_dictionary_filtered.txt', 'w', encoding='UTF-8') as file:
    for word_no_tonos, word in zip(filtered_words_no_tonos, filtered_words):
        file.write(word_no_tonos + ':' + word + '\n')
import json
import os
import sys

def remove_duplicate_tasks(file_path):
    # load the JSON data from the specified file
    with open(file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)
    for player, attributes in data.items():
        attributes['tasks'] = list(set(attributes['tasks']))

    # save the updated JSON back to the file
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=2)
    print(f"Updated tasks in {file_path} successfully.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python file.py <session_number>")
        sys.exit(1)

    session_number = sys.argv[1]
    directory = f"session{session_number}"
    json_file = "playerbase.json"
    file_path = os.path.join(directory, json_file)

    # check if the file exists
    if os.path.isfile(file_path):
        remove_duplicate_tasks(file_path)
    else:
        print(f"File not found: {file_path}")

import sys
from gtts import gTTS

words = sys.argv[1]
filename = sys.argv[2]

tts = gTTS(text=words, lang="en")
tts.save(filename)

sys.stdout.write("done")

import random
import re

SHORT_MESSAGE_WORDS = 8

# Everyday small talk needs no AI, so it works even when the AI's limit is reached.
PATTERNS = {
    "name": re.compile(
        r"(what('?s| is)\s+(your|ur|u?r)\s+name|wts\s+ur\s+name|who\s+are\s+(you|u)\b|\b(your|ur)\s+name|"
        r"unga\s+per|un\s+per|peru\s+enna|ningalude\s+per|mee\s+peru|nimma\s+hesaru|"
        r"உங்க(ள்)?\s*பெயர்|உன்\s*பெயர்|நீங்க(ள்)?\s*யார்|നിങ്ങളുടെ\s*പേര്|നിങ്ങൾ\s*ആരാണ്|"
        r"మీ\s*పేరు|మీరు\s*ఎవరు|ನಿಮ್ಮ\s*ಹೆಸರು|ನೀವು\s*ಯಾರು)",
        re.IGNORECASE,
    ),
    "how_are_you": re.compile(
        r"(how\s+are\s+(you|u)|how\s+r\s+u|eppadi\s+iru|epdi\s+iru|sukhamano|sugamano|bagunnara|hegiddira|"
        r"எப்படி\s*இருக்க|സുഖമാണോ|ఎలా\s*ఉన్నారు|ಹೇಗಿದ್ದೀರಾ)",
        re.IGNORECASE,
    ),
    "thanks": re.compile(
        r"^\W*(thanks|thank\s+(you|u)|thx|nandri|nanni|நன்றி|നന്ദി|ధన్యవాదాలు|ಧನ್ಯವಾದ)",
        re.IGNORECASE,
    ),
    "greeting": re.compile(
        r"^\W*(hi+|hello|hey|vanakkam|namaskaram|namaste|வணக்கம்|ஹலோ|നമസ്കാരം|ഹലോ|నమస్కారం|హలో|ನಮಸ್ಕಾರ|ಹಲೋ)\W*$",
        re.IGNORECASE,
    ),
}

REPLIES = {
    "en-IN": {
        "name": (
            "I'm Gayu, Alusea's AI sales assistant! I love helping people find the right doors and windows for their home. What are you planning?",
            "My name's Gayu, your AI assistant at Alusea. Tell me a little about your home, and let's find something you'll love.",
        ),
        "how_are_you": (
            "I'm doing great, thanks for asking! Even better now that we're talking about your home. What are you working on?",
            "Doing really well, thank you! How's your home project coming along?",
        ),
        "thanks": (
            "You're very welcome! I'm here whenever you need me.",
            "My pleasure! Is there anything else you'd like to look at?",
        ),
        "greeting": (
            "Hello! So glad you stopped by. Are you building a new home, or upgrading the one you have?",
            "Hi there! I'm Gayu from Alusea. What's on your mind for your home today?",
        ),
        "sorry": (
            "Sorry, I can't answer right now. Please try again in a moment, or call us on +91 96260 22722.",
            "Give me a moment, I'm having a little trouble. Please try again shortly, or reach our team on +91 96260 22722.",
            "Sorry, I'm having trouble answering right now. Please try again in a while, or call us on +91 96260 22722.",
        ),
        "wait": (
            "One moment please, let me check that for you.",
            "Just a moment, let me look at that for you.",
        ),
        "not_heard": (
            "Sorry, I didn't catch that. Could you say it again?",
            "Sorry, the line wasn't clear. Please say that once more.",
        ),
    },
    "ta-IN": {
        "name": (
            "நான் காயு, Alusea-வோட AI sales assistant! உங்க வீட்டுக்கு சரியான கதவு, ஜன்னல் கண்டுபிடிக்க உதவி பண்றது எனக்கு ரொம்ப பிடிக்கும். என்ன plan பண்றீங்க?",
            "என் பேரு காயு, Alusea-ல உங்க AI assistant. உங்க வீட்டப் பத்தி கொஞ்சம் சொல்லுங்க, உங்களுக்குப் பிடிச்ச மாதிரி ஒண்ணு பாக்கலாம்.",
        ),
        "how_are_you": (
            "நான் நல்லா இருக்கேன், கேட்டதுக்கு ரொம்ப நன்றி! உங்க வீட்டப் பத்தி பேசுறது இன்னும் சந்தோஷம். வீட்டுல என்ன வேலை நடக்குது?",
            "ரொம்ப நல்லா இருக்கேன், நன்றி! உங்க வீட்டு வேலை எப்படி போயிட்டு இருக்கு?",
        ),
        "thanks": (
            "பரவாயில்லங்க! எப்போ வேணும்னாலும் கேளுங்க, நான் இருக்கேன்.",
            "சந்தோஷம்ங்க! வேற ஏதாச்சும் பாக்கணுமா?",
        ),
        "greeting": (
            "வணக்கம்! நீங்க வந்ததுல ரொம்ப சந்தோஷம். புதுசா வீடு கட்டறீங்களா, இல்ல இருக்கற வீட்டையே மாத்தறீங்களா?",
            "வணக்கம்! நான் Alusea-ல இருந்து காயு பேசறேன். இன்னைக்கு உங்க வீட்டுக்கு என்ன பண்ணலாம்னு நெனைக்கிறீங்க?",
        ),
        "sorry": (
            "மன்னிச்சுக்கோங்க, இப்போ என்னால பதில் சொல்ல முடியல. கொஞ்ச நேரம் கழிச்சு திரும்ப try பண்ணுங்க, இல்லன்னா +91 96260 22722-க்கு phone பண்ணுங்க.",
            "ஒரு நிமிஷம், எனக்கு கொஞ்சம் problem இருக்கு. கொஞ்ச நேரம் கழிச்சு திரும்ப try பண்ணுங்க, இல்லன்னா +91 96260 22722-ல எங்க team-அ கூப்பிடுங்க.",
            "மன்னிச்சுக்கோங்க, இப்போ பதில் சொல்ல கொஞ்சம் கஷ்டமா இருக்கு. கொஞ்ச நேரம் கழிச்சு try பண்ணுங்க, இல்லன்னா +91 96260 22722-க்கு phone பண்ணுங்க.",
        ),
        "wait": (
            "ஒரு நிமிஷம், இதப் பாத்து சொல்றேன்.",
            "கொஞ்சம் பொறுங்க, இதப் பாத்து சொல்றேன்.",
        ),
        "not_heard": (
            "மன்னிச்சுக்கோங்க, சரியா கேக்கல. இன்னொரு தடவை சொல்ல முடியுமா?",
            "மன்னிச்சுக்கோங்க, line சரியா இல்ல. திரும்ப ஒரு தடவை சொல்லுங்க.",
        ),
    },
    "ml-IN": {
        "name": (
            "ഞാൻ ഗായു ആണ്, Alusea-യുടെ AI sales assistant! നിങ്ങളുടെ വീടിന് പറ്റിയ വാതിലുകളും ജനലുകളും കണ്ടെത്താൻ സഹായിക്കുന്നത് എനിക്ക് വളരെ ഇഷ്ടമാണ്. എന്താണ് plan?",
            "എന്റെ പേര് ഗായു, Alusea-യിലെ നിങ്ങളുടെ AI assistant. നിങ്ങളുടെ വീടിനെക്കുറിച്ച് കുറച്ച് പറയൂ, ഇഷ്ടപ്പെടുന്ന ഒന്ന് നമുക്ക് കണ്ടെത്താം.",
        ),
        "how_are_you": (
            "എനിക്ക് സുഖമാണ്, ചോദിച്ചതിന് നന്ദി! നിങ്ങളുടെ വീടിനെക്കുറിച്ച് സംസാരിക്കുന്നത് ഇനിയും സന്തോഷം. വീട്ടിൽ എന്ത് പണിയാണ് നടക്കുന്നത്?",
            "വളരെ സുഖമാണ്, നന്ദി! വീട്ടുപണി എങ്ങനെ പോകുന്നു?",
        ),
        "thanks": (
            "അതിനെന്താ! എപ്പോൾ വേണമെങ്കിലും ചോദിക്കാം, ഞാൻ ഇവിടെയുണ്ട്.",
            "സന്തോഷം! വേറെ എന്തെങ്കിലും നോക്കാനുണ്ടോ?",
        ),
        "greeting": (
            "നമസ്കാരം! വന്നതിൽ വളരെ സന്തോഷം. പുതിയ വീട് പണിയുകയാണോ, അതോ ഇപ്പോഴുള്ള വീട് പുതുക്കുകയാണോ?",
            "നമസ്കാരം! ഞാൻ Alusea-യിൽ നിന്നുള്ള ഗായു ആണ്. ഇന്ന് വീടിനായി എന്താണ് ആലോചിക്കുന്നത്?",
        ),
        "sorry": (
            "ക്ഷമിക്കണം, ഇപ്പോൾ മറുപടി പറയാൻ പറ്റുന്നില്ല. കുറച്ചു കഴിഞ്ഞ് വീണ്ടും try ചെയ്യണേ, അല്ലെങ്കിൽ +91 96260 22722 എന്ന നമ്പറിൽ വിളിക്കണേ.",
            "ഒരു നിമിഷം, എനിക്ക് ചെറിയൊരു പ്രശ്നമുണ്ട്. കുറച്ചു കഴിഞ്ഞ് വീണ്ടും try ചെയ്യണേ, അല്ലെങ്കിൽ +91 96260 22722 എന്ന നമ്പറിൽ ഞങ്ങളുടെ team-നെ വിളിക്കണേ.",
            "ക്ഷമിക്കണം, ഇപ്പോൾ മറുപടി പറയാൻ കുറച്ച് ബുദ്ധിമുട്ടുണ്ട്. കുറച്ചു കഴിഞ്ഞ് try ചെയ്യണേ, അല്ലെങ്കിൽ +91 96260 22722 എന്ന നമ്പറിൽ വിളിക്കണേ.",
        ),
        "wait": (
            "ഒരു നിമിഷം, ഞാൻ ഇതൊന്ന് നോക്കട്ടെ.",
            "കുറച്ചു സമയം തരൂ, ഞാൻ ഇതൊന്ന് നോക്കട്ടെ.",
        ),
        "not_heard": (
            "ക്ഷമിക്കണം, ശരിക്ക് കേട്ടില്ല. ഒന്നുകൂടി പറയാമോ?",
            "ക്ഷമിക്കണം, line ശരിയല്ലായിരുന്നു. ഒന്നുകൂടി പറയണേ.",
        ),
    },
    "te-IN": {
        "name": (
            "నేను గాయు, Alusea AI sales assistant-ని! మీ ఇంటికి సరైన తలుపులు, కిటికీలు వెతకడంలో సహాయం చేయడం నాకు చాలా ఇష్టం. మీరు ఏం plan చేస్తున్నారు?",
            "నా పేరు గాయు, Alusea లో మీ AI assistant-ని. మీ ఇంటి గురించి కొంచెం చెప్పండి, మీకు నచ్చేది చూద్దాం.",
        ),
        "how_are_you": (
            "నేను బాగున్నాను, అడిగినందుకు ధన్యవాదాలు! మీ ఇంటి గురించి మాట్లాడటం ఇంకా సంతోషం. మీ ఇంట్లో ఏం పని జరుగుతోంది?",
            "చాలా బాగున్నాను, ధన్యవాదాలు! మీ ఇంటి పని ఎలా జరుగుతోంది?",
        ),
        "thanks": (
            "పర్వాలేదు! మీకు ఎప్పుడు సహాయం కావాలన్నా నేను ఇక్కడే ఉంటాను.",
            "సంతోషం! ఇంకేమైనా చూడాలనుకుంటున్నారా?",
        ),
        "greeting": (
            "నమస్కారం! మీరు వచ్చినందుకు చాలా సంతోషం. మీరు కొత్త ఇల్లు కట్టుకుంటున్నారా, లేక ఉన్న ఇంటిని upgrade చేసుకుంటున్నారా?",
            "నమస్కారం! నేను Alusea నుంచి గాయు-ని. ఈరోజు మీ ఇంటి కోసం ఏం ఆలోచిస్తున్నారు?",
        ),
        "sorry": (
            "క్షమించండి, ఇప్పుడు నేను సమాధానం చెప్పలేకపోతున్నాను. కాసేపటి తర్వాత మళ్ళీ try చేయండి, లేదా +91 96260 22722-కి call చేయండి.",
            "ఒక్క నిమిషం, నాకు చిన్న ఇబ్బంది వచ్చింది. కాసేపటి తర్వాత మళ్ళీ try చేయండి, లేదా +91 96260 22722-కి మా team-కి call చేయండి.",
            "క్షమించండి, ఇప్పుడు సమాధానం చెప్పడం కొంచెం కష్టంగా ఉంది. కాసేపటి తర్వాత try చేయండి, లేదా +91 96260 22722-కి call చేయండి.",
        ),
        "wait": (
            "ఒక్క నిమిషం, ఇది చూసి చెప్తాను.",
            "కొంచెం ఆగండి, ఇది చూసి చెప్తాను.",
        ),
        "not_heard": (
            "క్షమించండి, సరిగా వినిపించలేదు. మళ్ళీ చెప్పగలరా?",
            "క్షమించండి, line సరిగా లేదు. ఇంకోసారి చెప్పండి.",
        ),
    },
    "kn-IN": {
        "name": (
            "ನಾನು ಗಾಯು, Alusea-ದ AI sales assistant! ನಿಮ್ಮ ಮನೆಗೆ ಸರಿಯಾದ ಬಾಗಿಲು, ಕಿಟಕಿ ಹುಡುಕೋಕೆ ಸಹಾಯ ಮಾಡೋದು ನನಗೆ ತುಂಬಾ ಇಷ್ಟ. ನೀವು ಏನು plan ಮಾಡ್ತಿದ್ದೀರಿ?",
            "ನನ್ನ ಹೆಸರು ಗಾಯು, Alusea-ದಲ್ಲಿ ನಿಮ್ಮ AI assistant. ನಿಮ್ಮ ಮನೆ ಬಗ್ಗೆ ಸ್ವಲ್ಪ ಹೇಳಿ, ನಿಮಗೆ ಇಷ್ಟ ಆಗೋದನ್ನ ಹುಡುಕೋಣ.",
        ),
        "how_are_you": (
            "ನಾನು ಚೆನ್ನಾಗಿದ್ದೀನಿ, ಕೇಳಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಮನೆ ಬಗ್ಗೆ ಮಾತಾಡೋದು ಇನ್ನೂ ಖುಷಿ. ಮನೇಲಿ ಏನು ಕೆಲಸ ನಡೀತಿದೆ?",
            "ತುಂಬಾ ಚೆನ್ನಾಗಿದ್ದೀನಿ, ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಮನೆ ಕೆಲಸ ಹೇಗೆ ನಡೀತಿದೆ?",
        ),
        "thanks": (
            "ಪರವಾಗಿಲ್ಲ! ನಿಮಗೆ ಯಾವಾಗ ಬೇಕಾದ್ರೂ ನಾನು ಇಲ್ಲಿ ಇರ್ತೀನಿ.",
            "ಖುಷಿ ಆಯ್ತು! ಬೇರೆ ಏನಾದ್ರೂ ನೋಡಬೇಕಾ?",
        ),
        "greeting": (
            "ನಮಸ್ಕಾರ! ನೀವು ಬಂದಿದ್ದಕ್ಕೆ ಖುಷಿ ಆಯ್ತು. ಹೊಸ ಮನೆ ಕಟ್ತಿದ್ದೀರಾ, ಅಥವಾ ಈಗ ಇರೋ ಮನೆಯನ್ನ upgrade ಮಾಡ್ತಿದ್ದೀರಾ?",
            "ನಮಸ್ಕಾರ! ನಾನು Alusea-ದಿಂದ ಗಾಯು ಮಾತಾಡ್ತಿದ್ದೀನಿ. ಇವತ್ತು ನಿಮ್ಮ ಮನೆಗೆ ಏನು ಯೋಚನೆ ಮಾಡ್ತಿದ್ದೀರಿ?",
        ),
        "sorry": (
            "ಕ್ಷಮಿಸಿ, ಈಗ ಉತ್ತರ ಕೊಡೋಕೆ ಆಗ್ತಿಲ್ಲ. ಸ್ವಲ್ಪ ಹೊತ್ತಾದ ಮೇಲೆ ಮತ್ತೆ try ಮಾಡಿ, ಇಲ್ಲಾಂದ್ರೆ +91 96260 22722-ಗೆ call ಮಾಡಿ.",
            "ಒಂದು ನಿಮಿಷ, ನನಗೆ ಸ್ವಲ್ಪ ತೊಂದರೆ ಆಗ್ತಿದೆ. ಸ್ವಲ್ಪ ಹೊತ್ತಾದ ಮೇಲೆ ಮತ್ತೆ try ಮಾಡಿ, ಇಲ್ಲಾಂದ್ರೆ +91 96260 22722-ಗೆ ನಮ್ಮ team-ಗೆ call ಮಾಡಿ.",
            "ಕ್ಷಮಿಸಿ, ಈಗ ಉತ್ತರ ಕೊಡೋಕೆ ಸ್ವಲ್ಪ ಕಷ್ಟ ಆಗ್ತಿದೆ. ಸ್ವಲ್ಪ ಹೊತ್ತಾದ ಮೇಲೆ try ಮಾಡಿ, ಇಲ್ಲಾಂದ್ರೆ +91 96260 22722-ಗೆ call ಮಾಡಿ.",
        ),
        "wait": (
            "ಒಂದು ನಿಮಿಷ, ಇದನ್ನ ನೋಡಿ ಹೇಳ್ತೀನಿ.",
            "ಸ್ವಲ್ಪ ಇರಿ, ಇದನ್ನ ನೋಡಿ ಹೇಳ್ತೀನಿ.",
        ),
        "not_heard": (
            "ಕ್ಷಮಿಸಿ, ಸರಿಯಾಗಿ ಕೇಳಿಸ್ಲಿಲ್ಲ. ಮತ್ತೆ ಹೇಳ್ತೀರಾ?",
            "ಕ್ಷಮಿಸಿ, line ಸರಿಯಾಗಿ ಇರಲಿಲ್ಲ. ಇನ್ನೊಂದು ಸಲ ಹೇಳಿ.",
        ),
    },
}


def small_talk(message: str, language: str) -> str | None:
    """Answer everyday small talk in varied wording. Anything else returns None for the AI to answer."""
    if len(message.split()) > SHORT_MESSAGE_WORDS:
        return None
    for topic, pattern in PATTERNS.items():
        if pattern.search(message):
            return random.choice(REPLIES[language][topic])
    return None


LIMIT_TEXT = {
    "en-IN": "You've reached today's limit for chatting with Gayu. Please call +91 96260 22722, or send your name and number here, and our team will call you.",
    "ta-IN": "இன்னைக்கு காயுகிட்ட chat பண்ற limit முடிஞ்சிடுச்சு. +91 96260 22722-க்கு call பண்ணுங்க, இல்லன்னா உங்க பேரும் number-உம் இங்க அனுப்புங்க, எங்க team உங்களுக்கு call பண்ணுவாங்க.",
    "ml-IN": "ഇന്ന് ഗായുവുമായി chat ചെയ്യാനുള്ള limit കഴിഞ്ഞു. +91 96260 22722 എന്ന നമ്പറിൽ വിളിക്കൂ, അല്ലെങ്കിൽ നിങ്ങളുടെ പേരും നമ്പറും ഇവിടെ അയക്കൂ, ഞങ്ങളുടെ team വിളിക്കും.",
    "te-IN": "ఈ రోజు గాయుతో chat చేసే limit అయిపోయింది. +91 96260 22722-కి call చేయండి, లేదా మీ పేరు, నంబర్ ఇక్కడ పంపండి, మా team మీకు call చేస్తుంది.",
    "kn-IN": "ಇವತ್ತು ಗಾಯು ಜೊತೆ chat ಮಾಡುವ limit ಮುಗಿದಿದೆ. +91 96260 22722-ಗೆ call ಮಾಡಿ, ಇಲ್ಲಾಂದ್ರೆ ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು ನಂಬರ್ ಇಲ್ಲಿ ಕಳುಹಿಸಿ, ನಮ್ಮ team ನಿಮಗೆ call ಮಾಡುತ್ತೆ.",
}


def limit_message(language: str) -> str:
    return LIMIT_TEXT[language]


def sorry_message(language: str) -> str:
    return random.choice(REPLIES[language]["sorry"])


def wait_message(language: str) -> str:
    return random.choice(REPLIES[language]["wait"])


def not_heard_message(language: str) -> str:
    return random.choice(REPLIES[language]["not_heard"])

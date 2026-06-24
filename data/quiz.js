/* ============================================================================
   ✦ المرحلة الأولى: الأسئلة  —  Stage 1: the quiz ✦
   ============================================================================
   حوراء تجاوب على الأسئلة قبل ما تكمل للميمز. أي إجابة تنقلها للسؤال التالي،
   ويظهر ردّ مختلف حسب الخيار الذي اختارته.
   Hawraa answers the questions before moving on. ANY answer advances, and a
   different reply shows depending on the option she picked.

   كل سؤال كتلة { ... }. الحقول / Each question is one { ... } block. Fields:
     q        نص السؤال — the question text.
     options  مصفوفة الخيارات. كل خيار { label, reply }:
              the answer choices. Each option is { label, reply }:
                label  النص الظاهر على الزر — the text shown on the button.
                reply  الردّ الذي يظهر عند اختيار هذا الخيار — the reply shown when picked.
     correct  (اختياري) رقم الخيار "الصحيح" يبدأ من 0 — لتلوينه ذهبيًا وإطلاق القصاصات.
              (optional) index of the "right" option (0 = first) — it glows gold + confetti.
              الخيارات الأخرى تهتزّ قليلًا. ضعه null إذا ما في إجابة صحيحة (كل الخيارات عادية).
              Other options do a little shake. Set to null if there's no right answer.

   ملاحظة: مهما كانت الإجابة، تنتقل تلقائيًا للسؤال التالي بعد عرض الرد.
   Note: whatever she answers, it auto-advances to the next question after the reply.
   ============================================================================ */

window.QUIZ = [
  // ---- السؤال ١ / Question 1 (له إجابة صحيحة: نايا) ----
  {
    q: "خلال السنة الماضية كان في نسنس كبير بالقروب… مين كان؟",
    options: [
      { label: "نايا", reply: "كففووووو تعرفين النسنس الله يحفظنا منها 😼" },
      { label: "فويد", reply: "تبا لك ما تعرفين لنسنس 😤" },
      { label: "جوني", reply: "تبا لك ما تعرفين لنسنس 😤" },
      { label: "ولا احد كلنا حبابين", reply: "تبا لك ما تعرفين لنسنس 😤" },
    ],
    correct: 0, // نايا هي الإجابة الصحيحة — لكن أي إجابة تكمّل للسؤال التالي
  },

  // ---- السؤال ٢ / Question 2 (مفتوح: أي خيار تمام) ----
  {
    q: "السنة الجاية مين بدك يريحك ويتزوج ويضف وجه؟",
    options: [
      { label: "نايا", reply: "نايا: الله يزوجك انت ويرزقك 40 هامستر 🐹" },
      { label: "الاء", reply: "الاء: الله يزوجك انت ويرزقك 40 هامستر 🐹" },
      { label: "جوني", reply: "جوني: الله يزوجك انت ويرزقك 40 هامستر 🐹" },
      { label: "واحد اخر", reply: "واحد اخر: الله يزوجك انت ويرزقك 40 هامستر 🐹" },
    ],
    correct: null,
  },

  // ---- السؤال ٣ / Question 3 (نعم / لا) ----
  {
    q: "هل تقبلين بكمال عشانه يشبه الممثلين؟",
    options: [
      { label: "نعم", reply: "امواح يا امواح كمال 😘" },
      { label: "لا", reply: "اصلا علاوي هي امواح كمال 😏" },
    ],
    correct: null,
  },
];

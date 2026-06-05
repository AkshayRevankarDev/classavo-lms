"""
Seed the database with demo AI courses, instructors, students and progress.

Idempotent: re-running will not create duplicates (it looks up by username /
course title), and will not clobber existing chapter content.

Usage:
    python manage.py seed_demo
    python manage.py seed_demo --reset   # wipe demo objects first
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import Chapter, ChapterProgress, Course, Enrollment, User


PASSWORD = "Demo1234!"


# ---- Plate.js content builders -------------------------------------------


def p(*runs):
    """Paragraph node. Pass plain strings or (text, marks) tuples."""
    children = []
    for r in runs:
        if isinstance(r, tuple):
            text, marks = r
            node = {"text": text}
            for m in marks:
                node[m] = True
            children.append(node)
        else:
            children.append({"text": r})
    return {"type": "p", "children": children}


def h(level, text):
    return {"type": f"h{level}", "children": [{"text": text}]}


def chapter_body(title, paragraphs):
    """Build a Plate.js value (array of nodes) for a chapter."""
    nodes = [h(1, title)]
    for para in paragraphs:
        if isinstance(para, str) and para.startswith("## "):
            nodes.append(h(2, para[3:]))
        elif isinstance(para, str) and para.startswith("### "):
            nodes.append(h(3, para[4:]))
        elif isinstance(para, str):
            nodes.append(p(para))
        else:
            # already a node
            nodes.append(para)
    return nodes


# ---- Seed data ------------------------------------------------------------


INSTRUCTORS = [
    {"username": "sarah_chen", "email": "sarah.chen@example.com"},
    {"username": "michael_torres", "email": "michael.torres@example.com"},
    {"username": "priya_sharma", "email": "priya.sharma@example.com"},
]

STUDENTS = [
    {"username": "emma_wilson", "email": "emma.wilson@example.com"},
    {"username": "david_kim", "email": "david.kim@example.com"},
    {"username": "olivia_martinez", "email": "olivia.martinez@example.com"},
    {"username": "james_lee", "email": "james.lee@example.com"},
    {"username": "aisha_patel", "email": "aisha.patel@example.com"},
]


COURSES = [
    {
        "instructor": "sarah_chen",
        "name": "Introduction to Machine Learning",
        "description": (
            "Foundations of supervised and unsupervised learning. Covers linear "
            "models, decision trees, evaluation, and a hands-on intro to scikit-learn."
        ),
        "chapters": [
            {
                "title": "What is Machine Learning?",
                "visibility": "public",
                "body": [
                    "Machine learning is a field that studies how computers can learn from data without being explicitly programmed for every rule.",
                    "## Three core paradigms",
                    p("In ", ("supervised learning", ["bold"]), ", we train on labelled examples. In ", ("unsupervised learning", ["bold"]), ", we find structure in unlabelled data. In ", ("reinforcement learning", ["bold"]), ", an agent learns by interacting with an environment."),
                    "By the end of this course you'll be able to identify which paradigm a real problem belongs to and pick a sensible starting model.",
                ],
            },
            {
                "title": "Linear Regression from Scratch",
                "visibility": "public",
                "body": [
                    "Linear regression is the simplest useful model. It fits a straight line to data by minimising the squared error.",
                    "## The math, briefly",
                    p("Given features x and weights w, the prediction is ", ("y = w·x + b", ["italic"]), ". We pick w and b to minimise the mean squared error across the training set."),
                    "## Why it still matters",
                    "Even in the era of deep learning, linear baselines are essential: they tell you whether a complex model is actually adding value.",
                ],
            },
            {
                "title": "Classification with Logistic Regression",
                "visibility": "public",
                "body": [
                    "Logistic regression is a misleadingly named classifier — it predicts probabilities of class membership.",
                    "## Decision boundary",
                    "It draws a linear boundary in feature space and uses the sigmoid function to squash the score into a probability between 0 and 1.",
                    p("Pair it with ", ("regularisation", ["bold"]), " to keep the weights small and the model well-behaved on unseen data."),
                ],
            },
            {
                "title": "Cross-validation and Evaluation Metrics",
                "visibility": "private",
                "body": [
                    "This chapter is still being written — it will cover k-fold cross validation, precision/recall, ROC curves, and how to choose the right metric for a problem.",
                ],
            },
        ],
    },
    {
        "instructor": "sarah_chen",
        "name": "Deep Learning with PyTorch",
        "description": (
            "Build neural networks from first principles using PyTorch. We cover "
            "autograd, training loops, CNNs, and a tiny transformer at the end."
        ),
        "chapters": [
            {
                "title": "Tensors and Autograd",
                "visibility": "public",
                "body": [
                    "PyTorch's two pillars are tensors (multi-dimensional arrays on CPU or GPU) and autograd (automatic differentiation).",
                    "## A first computation graph",
                    p("Every operation on a tensor with ", ("requires_grad=True", ["italic"]), " is recorded. Calling .backward() walks that graph and accumulates gradients."),
                    "Get comfortable with this — every model below is just a larger graph.",
                ],
            },
            {
                "title": "Building Your First Neural Network",
                "visibility": "public",
                "body": [
                    "A neural network is a stack of linear layers separated by non-linear activation functions.",
                    "## The training loop",
                    "Forward pass → compute loss → backward pass → step the optimiser → zero the gradients. Four lines, repeated until convergence.",
                    p("Start with a single hidden layer on MNIST. If you can get above ", ("97% accuracy", ["bold"]), ", you've internalised the loop."),
                ],
            },
            {
                "title": "Convolutional Networks for Images",
                "visibility": "public",
                "body": [
                    "Convolutions exploit two things about images: locality (nearby pixels relate) and translation invariance (a cat is a cat anywhere in the frame).",
                    "## Anatomy of a CNN",
                    "Convolution → ReLU → pooling, repeated, then a dense classifier head. That's the recipe used by everything from LeNet to ResNet.",
                ],
            },
            {
                "title": "A Minimal Transformer",
                "visibility": "private",
                "body": [
                    "Draft chapter — will walk through self-attention, multi-head attention, and a 100-line transformer trained on Shakespeare.",
                ],
            },
        ],
    },
    {
        "instructor": "michael_torres",
        "name": "Large Language Models in Practice",
        "description": (
            "Beyond the hype: prompting strategies, retrieval-augmented generation, "
            "fine-tuning, and how to ship LLM features without burning your budget."
        ),
        "chapters": [
            {
                "title": "How LLMs Actually Work",
                "visibility": "public",
                "body": [
                    "A large language model is a transformer trained to predict the next token. That single objective, scaled, produces astonishing emergent abilities.",
                    "## Tokens, not words",
                    "Models see tokens — sub-word units. Understanding tokenisation is the difference between a clean prompt and one that blows your context budget.",
                    p("Rule of thumb: ", ("1 token ≈ 4 characters of English", ["italic"]), "."),
                ],
            },
            {
                "title": "Prompt Engineering Patterns",
                "visibility": "public",
                "body": [
                    "Good prompts are specific, structured, and give the model an out.",
                    "## Three patterns worth knowing",
                    p("1. ", ("Few-shot examples", ["bold"]), " — show, don't tell."),
                    p("2. ", ("Chain-of-thought", ["bold"]), " — ask the model to reason step by step before answering."),
                    p("3. ", ("Self-consistency", ["bold"]), " — sample multiple answers and vote."),
                    "Prompting is empirical. Measure, don't guess.",
                ],
            },
            {
                "title": "Retrieval-Augmented Generation (RAG)",
                "visibility": "public",
                "body": [
                    "RAG grounds an LLM in your own data by retrieving relevant chunks at inference time and stuffing them into the prompt.",
                    "## The pipeline",
                    "Embed your documents, store the vectors, query with the user's question, retrieve top-k chunks, and let the LLM compose an answer that cites them.",
                    "The hardest part is rarely the model — it's chunking, ranking, and evaluation.",
                ],
            },
            {
                "title": "Fine-tuning vs Prompting",
                "visibility": "public",
                "body": [
                    "Prompting is fast, cheap, and reversible. Fine-tuning bakes behaviour in but costs compute and data.",
                    p("Default to ", ("prompt + RAG", ["bold"]), ". Reach for fine-tuning only when you have stable, high-volume tasks and need lower latency or specialised tone."),
                ],
            },
        ],
    },
    {
        "instructor": "michael_torres",
        "name": "NLP with Transformers",
        "description": (
            "From word embeddings to BERT to modern encoder-decoder architectures. "
            "Covers classification, named entity recognition, and summarisation."
        ),
        "chapters": [
            {
                "title": "From Word2Vec to Contextual Embeddings",
                "visibility": "public",
                "body": [
                    "Static embeddings like Word2Vec gave every word a single vector. Contextual embeddings from BERT give the same word different vectors in different sentences.",
                    "## Why context matters",
                    p("Consider the word \"bank\" in \"river bank\" vs \"savings bank\". Static embeddings collapse them; contextual ones don't."),
                ],
            },
            {
                "title": "Self-Attention Explained",
                "visibility": "public",
                "body": [
                    "Attention lets every token in a sequence look at every other token and decide what to pay attention to.",
                    "## Three matrices: Q, K, V",
                    "Queries ask, Keys advertise, Values deliver. The dot product of Q and K, softmax-normalised, weights the V's. That's all of attention.",
                ],
            },
            {
                "title": "Fine-tuning BERT for Classification",
                "visibility": "private",
                "body": [
                    "Draft — covers the [CLS] token trick, classification heads, and learning-rate warmup.",
                ],
            },
        ],
    },
    {
        "instructor": "priya_sharma",
        "name": "Computer Vision Fundamentals",
        "description": (
            "Classical and modern computer vision: from edges and SIFT to convolutional "
            "networks, object detection, and segmentation."
        ),
        "chapters": [
            {
                "title": "How Computers See Images",
                "visibility": "public",
                "body": [
                    "An image is just a grid of numbers. Each pixel has channels — usually red, green, and blue — and each channel is an intensity from 0 to 255.",
                    "## Resolution, channels, depth",
                    "Once you internalise that, everything from filters to convolutions becomes a question of how to combine these numbers usefully.",
                ],
            },
            {
                "title": "Edge Detection and Filters",
                "visibility": "public",
                "body": [
                    "Before deep learning, vision was built on hand-crafted filters: Sobel, Gaussian, Laplacian.",
                    "## A surprising lesson",
                    p("The first layer of a CNN often learns ", ("similar filters on its own", ["italic"]), ". The principles haven't changed; the model just learns them now."),
                ],
            },
            {
                "title": "Object Detection with YOLO",
                "visibility": "public",
                "body": [
                    "YOLO — You Only Look Once — frames detection as a regression problem solved in a single forward pass.",
                    "## Why it took off",
                    "Real-time speed without giving up much accuracy. The trade-off that made detection practical for video.",
                ],
            },
            {
                "title": "Semantic Segmentation",
                "visibility": "private",
                "body": [
                    "Draft — will cover U-Net, encoder-decoder architectures, and dice loss.",
                ],
            },
        ],
    },
    {
        "instructor": "priya_sharma",
        "name": "Reinforcement Learning Basics",
        "description": (
            "The mathematics and intuition behind agents that learn from reward. "
            "Markov decision processes, Q-learning, policy gradients, and AlphaGo's idea."
        ),
        "chapters": [
            {
                "title": "Agents, Environments, and Rewards",
                "visibility": "public",
                "body": [
                    "Reinforcement learning is the study of agents that take actions in an environment to maximise cumulative reward.",
                    "## The loop",
                    "Observe state → choose action → receive reward and next state → update policy. Everything else in RL is variations on this loop.",
                ],
            },
            {
                "title": "Q-Learning Step by Step",
                "visibility": "public",
                "body": [
                    "Q-learning estimates the expected future reward of taking each action in each state.",
                    p("The update rule is famously simple: ", ("Q(s, a) ← Q(s, a) + α[r + γ max Q(s', a') − Q(s, a)]", ["italic"]), "."),
                    "Implement it on FrozenLake before reading another paper.",
                ],
            },
            {
                "title": "Policy Gradients",
                "visibility": "private",
                "body": [
                    "Draft — REINFORCE, baselines, and why actor-critic methods reduce variance.",
                ],
            },
        ],
    },
    {
        "instructor": "michael_torres",
        "name": "MLOps and Model Deployment",
        "description": (
            "Take a model from notebook to production. Versioning, monitoring, "
            "shadow deploys, and the unglamorous work that keeps ML systems alive."
        ),
        "chapters": [
            {
                "title": "Why MLOps Exists",
                "visibility": "public",
                "body": [
                    "An ML model is 5% of the system that surrounds it. MLOps is the discipline of treating the other 95% seriously.",
                    "## What it covers",
                    p("Data and model ", ("versioning", ["bold"]), ", reproducible training, ", ("monitoring", ["bold"]), " for drift, and rollback strategies when things go wrong."),
                ],
            },
            {
                "title": "Containerising a Model API",
                "visibility": "public",
                "body": [
                    "Wrap your model in a small FastAPI service and Docker image. Same image runs on your laptop and in production.",
                    "## A note on cold starts",
                    "Lazy-load the model weights so your container starts in seconds, not minutes.",
                ],
            },
            {
                "title": "Monitoring for Drift",
                "visibility": "private",
                "body": [
                    "Draft — feature drift, label drift, and the alerts you actually want paged on.",
                ],
            },
        ],
    },
    {
        "instructor": "priya_sharma",
        "name": "AI Ethics and Responsible AI",
        "description": (
            "Bias, fairness, transparency, and the very real consequences of "
            "deploying models at scale. Not optional reading."
        ),
        "chapters": [
            {
                "title": "Where Bias Comes From",
                "visibility": "public",
                "body": [
                    "Bias enters a model through data, through proxies, and through the choices we make when defining the problem.",
                    "## A short checklist",
                    "Who is represented in the training data? Whose voices are missing? What does 'success' mean, and who decided?",
                ],
            },
            {
                "title": "Fairness Metrics",
                "visibility": "public",
                "body": [
                    "There are at least three reasonable definitions of fairness — and they are mathematically incompatible.",
                    p("Demographic parity, equal opportunity, and ", ("predictive parity", ["italic"]), " all sound right; they can't all be true at once."),
                    "Picking which definition matters is a values question, not a technical one.",
                ],
            },
            {
                "title": "Model Cards and Datasheets",
                "visibility": "private",
                "body": [
                    "Draft — the documentation patterns that turn 'trust me' into 'here's what's true'.",
                ],
            },
        ],
    },
]


# Mapping of which students enrol in which courses, and how many chapters
# each has completed.  Course names match the catalogue above.
ENROLLMENTS = [
    ("emma_wilson",      "Introduction to Machine Learning",  3),  # all public done
    ("emma_wilson",      "Deep Learning with PyTorch",        2),
    ("emma_wilson",      "Large Language Models in Practice", 1),
    ("david_kim",        "Large Language Models in Practice", 4),
    ("david_kim",        "NLP with Transformers",             2),
    ("david_kim",        "MLOps and Model Deployment",        1),
    ("olivia_martinez",  "Computer Vision Fundamentals",      2),
    ("olivia_martinez",  "Reinforcement Learning Basics",     1),
    ("olivia_martinez",  "Introduction to Machine Learning",  1),
    ("james_lee",        "Deep Learning with PyTorch",        3),
    ("james_lee",        "MLOps and Model Deployment",        2),
    ("aisha_patel",      "AI Ethics and Responsible AI",      2),
    ("aisha_patel",      "Computer Vision Fundamentals",      1),
    ("aisha_patel",      "Large Language Models in Practice", 2),
]


# ---- Command --------------------------------------------------------------


class Command(BaseCommand):
    help = "Seed the DB with demo AI courses, instructors, students and progress."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete demo courses/users first (keeps superusers).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            self.stdout.write(self.style.WARNING("Resetting demo data…"))
            demo_usernames = [u["username"] for u in INSTRUCTORS + STUDENTS]
            User.objects.filter(
                username__in=demo_usernames, is_superuser=False
            ).delete()
            Course.objects.filter(title__in=[c["name"] for c in COURSES]).delete()

        # --- users ---
        instructors = {}
        for spec in INSTRUCTORS:
            u, created = User.objects.get_or_create(
                username=spec["username"],
                defaults={"email": spec["email"], "role": User.Role.INSTRUCTOR},
            )
            if created or not u.has_usable_password():
                u.set_password(PASSWORD)
                u.email = spec["email"]
                u.role = User.Role.INSTRUCTOR
                u.save()
            instructors[spec["username"]] = u

        students = {}
        for spec in STUDENTS:
            u, created = User.objects.get_or_create(
                username=spec["username"],
                defaults={"email": spec["email"], "role": User.Role.STUDENT},
            )
            if created or not u.has_usable_password():
                u.set_password(PASSWORD)
                u.email = spec["email"]
                u.role = User.Role.STUDENT
                u.save()
            students[spec["username"]] = u

        self.stdout.write(
            f"Users ready: {len(instructors)} instructors, {len(students)} students."
        )

        # --- courses + chapters ---
        course_by_name = {}
        for spec in COURSES:
            instructor = instructors[spec["instructor"]]
            course, _ = Course.objects.get_or_create(
                title=spec["name"],
                defaults={
                    "instructor": instructor,
                    "description": spec["description"],
                },
            )
            # update description / instructor in case it changed
            course.description = spec["description"]
            course.instructor = instructor
            course.save()
            course_by_name[spec["name"]] = course

            for order, ch in enumerate(spec["chapters"]):
                chapter, created = Chapter.objects.get_or_create(
                    course=course,
                    title=ch["title"],
                    defaults={
                        "content": chapter_body(ch["title"], ch["body"]),
                        "is_public": ch["visibility"] == "public",
                        "order": order,
                    },
                )
                # Only overwrite content/visibility on freshly created rows so
                # we don't clobber instructor edits.
                if created:
                    chapter.is_public = ch["visibility"] == "public"
                    chapter.order = order
                    chapter.save()

        self.stdout.write(f"Courses ready: {len(course_by_name)}.")

        # --- enrollments + progress ---
        for student_username, course_name, completed_count in ENROLLMENTS:
            student = students[student_username]
            course = course_by_name[course_name]
            Enrollment.objects.get_or_create(student=student, course=course)

            public_chapters = list(
                course.chapters.filter(is_public=True).order_by("order", "id")
            )
            for ch in public_chapters[:completed_count]:
                ChapterProgress.objects.get_or_create(
                    student=student, chapter=ch
                )

        self.stdout.write(self.style.SUCCESS("Seed complete."))
        self.stdout.write("")
        self.stdout.write(self.style.NOTICE("Demo accounts (password for all: Demo1234!):"))
        self.stdout.write("  Instructors:")
        for u in INSTRUCTORS:
            self.stdout.write(f"    {u['email']:32s} ({u['username']})")
        self.stdout.write("  Students:")
        for u in STUDENTS:
            self.stdout.write(f"    {u['email']:32s} ({u['username']})")

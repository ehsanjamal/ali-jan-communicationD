# Smart Plant Disease Detection for Sustainable Farming

Final Year Project (BSCS) — a web app that takes a photo of a plant leaf and tells you what disease it has, if any.

## What it does

Upload a leaf image and the app runs it through a trained model that classifies it into one of 38 disease categories (across several crop types), then shows treatment tips for whatever it detects. Built this because manual disease diagnosis in farming is slow and needs an expert — the idea was to put something in a farmer's hands that can give an instant first read.

## How it works

- **Model:** MobileNetV2, fine-tuned using transfer learning instead of training from scratch (a plain CNN I tried first got to ~94-95% val accuracy, but MobileNetV2 generalized better)
- **Dataset:** PlantVillage (Kaggle), ~87,000 images across 38 classes
- **Training:** two-phase fine-tuning on Colab (GPU) — froze the base layers first, then unfroze and fine-tuned at a lower learning rate
- **Results:** 94.3% validation accuracy, 95% on the held-out test set (8,179 images), 0.95 weighted precision/recall/F1
- **Backend:** Flask — handles the image upload, runs it through the model, returns the prediction + treatment info
- **Frontend:** plain HTML/CSS/JS

## Tech stack

Python, TensorFlow/Keras, Flask, HTML/CSS/JS, trained on Google Colab

## Known limitation

The model is trained entirely on PlantVillage, which has clean, consistent backgrounds. It performs well on similar images but accuracy drops on real field photos — different lighting, backgrounds, angles. This is a known dataset-generalization gap and something I'm actively working on improving (more augmentation, maybe mixing in field-condition images).

## Running it locally

```
pip install -r requirements.txt
python app/flask_app.py
```

Then open the local server in your browser and upload a leaf image.

## Why this project

Precision agriculture is a big deal for a country like Pakistan where a large chunk of the economy runs on farming, and most small farmers don't have easy access to plant pathologists. Wanted to see how far a relatively lightweight model could get toward being actually useful here, not just a classroom accuracy number.

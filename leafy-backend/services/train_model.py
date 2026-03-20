import os
import json
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator # type: ignore
from keras.applications import MobileNetV2
from keras import layers, models

# ==============================
# CONFIG
# ==============================
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

train_dir = "plant_disease_dataset/Train"
val_dir = "plant_disease_dataset/Validation"
test_dir = "plant_disease_dataset/Test"

IMG_HEIGHT, IMG_WIDTH = 224, 224
BATCH_SIZE = 32
EPOCHS = 10

# ==============================
# DATA GENERATORS
# ==============================
train_datagen = ImageDataGenerator(
    rescale=1.0 / 255,
    rotation_range=30,
    zoom_range=0.2,
    horizontal_flip=True
)

val_test_datagen = ImageDataGenerator(rescale=1.0 / 255)

train_generator = train_datagen.flow_from_directory(
    train_dir,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode="categorical"
)

val_generator = val_test_datagen.flow_from_directory(
    val_dir,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode="categorical"
)

test_generator = val_test_datagen.flow_from_directory(
    test_dir,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    shuffle=False
)

num_classes = len(train_generator.class_indices)
print("Class Indices:", train_generator.class_indices)

# ==============================
# MODEL (TRANSFER LEARNING)
# ==============================
base_model = MobileNetV2(
    input_shape=(IMG_HEIGHT, IMG_WIDTH, 3),
    include_top=False,
    weights="imagenet"
)

# Freeze base model
base_model.trainable = False

# Custom head
x = base_model.output
x = layers.GlobalAveragePooling2D()(x)
x = layers.BatchNormalization()(x)
x = layers.Dense(128, activation="relu")(x)
x = layers.Dropout(0.5)(x)

outputs = layers.Dense(num_classes, activation="softmax")(x)

model = models.Model(inputs=base_model.input, outputs=outputs)

# ==============================
# COMPILE
# ==============================
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

# ==============================
# CALLBACKS
# ==============================
callbacks = [
    tf.keras.callbacks.EarlyStopping(
        monitor="val_loss",
        patience=3,
        restore_best_weights=True
    ),
    tf.keras.callbacks.ModelCheckpoint(
        "plant_disease_model_v2.keras",
        monitor="val_loss",
        save_best_only=True
    )
]

# ==============================
# TRAIN
# ==============================
history = model.fit(
    train_generator,
    epochs=EPOCHS,
    validation_data=val_generator,
    callbacks=callbacks
)

# ==============================
# EVALUATE
# ==============================
test_loss, test_acc = model.evaluate(test_generator)
print(f"\n✅ Test Accuracy: {test_acc:.4f}")

# ==============================
# SAVE (IMPORTANT 🔥)
# ==============================
model.save("final_model.keras")  # <-- forced save (no dependency on checkpoint)

with open("class_indices.json", "w") as f:
    json.dump(train_generator.class_indices, f)

print("✅ Model and class indices saved successfully!")
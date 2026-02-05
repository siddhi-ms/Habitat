import torch
from terratorch.registry import BACKBONE_REGISTRY

# Detect device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)  # Will print CPU or CUDA (GPU)

print("\nAvailable backbones:")
print(BACKBONE_REGISTRY.keys())

print("\nLoading Prithvi-EO-2.0-100M-TL backbone...")
model = BACKBONE_REGISTRY.build(
    "prithvi_eo_v2_100_tl",
    pretrained=True
)

# Move model to GPU if available
model = model.to(device)
model.eval()

# Dummy HLS-like input
x = torch.randn(1, 6, 224, 224).to(device)  # Move input to same device

print(f"\nModel is on device: {next(model.parameters()).device}")  # Confirm model device
print(f"Input tensor is on device: {x.device}")  # Confirm input device

with torch.no_grad():
    y = model(x)

print("\nModel output type:", type(y))
if isinstance(y, (list, tuple)):
    print("Feature maps:")
    for i, t in enumerate(y):
        print(f"  [{i}] shape = {t.shape}")
else:
    print("Output shape:", y.shape)

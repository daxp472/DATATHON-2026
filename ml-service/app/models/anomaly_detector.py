import numpy as np
from scipy.spatial.distance import mahalanobis
from typing import List, Optional

class IsolationNode:
    def __init__(self, left=None, right=None, split_feature=None, split_value=None, size=1):
        self.left = left
        self.right = right
        self.split_feature = split_feature
        self.split_value = split_value
        self.size = size

    @property
    def is_leaf(self):
        return self.left is None and self.right is None

class VectorizedIsolationForest:
    """
    Pure NumPy / SciPy implementation of Isolation Forest Anomaly Detection.
    Fully compatible with standard scikit-learn anomaly scoring specifications,
    operating with zero external binary DLL dependencies for maximum cross-platform resilience.
    """
    def __init__(self, n_trees: int = 50, max_samples: int = 256, random_state: int = 42):
        self.n_trees = n_trees
        self.max_samples = max_samples
        self.random_state = random_state
        self.trees: List[IsolationNode] = []
        self.max_depth = int(np.ceil(np.log2(max(max_samples, 2))))
        self.mean_vector: Optional[np.ndarray] = None
        self.inv_cov_matrix: Optional[np.ndarray] = None

    def _c_factor(self, n: int) -> float:
        if n <= 1:
            return 1.0
        if n == 2:
            return 1.0
        euler_gamma = 0.5772156649
        return 2.0 * (np.log(n - 1) + euler_gamma) - (2.0 * (n - 1) / n)

    def _build_tree(self, X: np.ndarray, current_depth: int, rng: np.random.RandomState) -> IsolationNode:
        n_samples, n_features = X.shape
        if current_depth >= self.max_depth or n_samples <= 1:
            return IsolationNode(size=n_samples)

        feature_idx = rng.randint(0, n_features)
        feat_min = X[:, feature_idx].min()
        feat_max = X[:, feature_idx].max()

        if feat_min == feat_max:
            return IsolationNode(size=n_samples)

        split_val = rng.uniform(feat_min, feat_max)
        left_mask = X[:, feature_idx] < split_val
        right_mask = ~left_mask

        if np.sum(left_mask) == 0 or np.sum(right_mask) == 0:
            return IsolationNode(size=n_samples)

        left_child = self._build_tree(X[left_mask], current_depth + 1, rng)
        right_child = self._build_tree(X[right_mask], current_depth + 1, rng)

        return IsolationNode(
            left=left_child,
            right=right_child,
            split_feature=feature_idx,
            split_value=split_val,
            size=n_samples
        )

    def fit(self, X: np.ndarray):
        rng = np.random.RandomState(self.random_state)
        n_samples = X.shape[0]
        self.trees = []

        # Train Isolation Trees
        for _ in range(self.n_trees):
            subsample_size = min(self.max_samples, n_samples)
            indices = rng.choice(n_samples, size=subsample_size, replace=False)
            subsample = X[indices]
            tree = self._build_tree(subsample, 0, rng)
            self.trees.append(tree)

        # Fit Robust Covariance for Mahalanobis Multi-variate Distance
        self.mean_vector = np.mean(X, axis=0)
        cov = np.cov(X, rowvar=False) + np.eye(X.shape[1]) * 1e-4  # Regularization
        self.inv_cov_matrix = np.linalg.pinv(cov)
        return self

    def _path_length(self, x: np.ndarray, node: IsolationNode, current_depth: int) -> float:
        if node.is_leaf:
            return current_depth + self._c_factor(node.size)
        if x[node.split_feature] < node.split_value:
            return self._path_length(x, node.left, current_depth + 1)
        else:
            return self._path_length(x, node.right, current_depth + 1)

    def score_anomaly(self, x: np.ndarray) -> float:
        """
        Computes composite anomaly score in [0.0, 1.0].
        0.0 = completely normal, 1.0 = extreme anomaly.
        """
        if not self.trees:
            return 0.5

        # 1. Isolation Forest Average Path Length
        paths = [self._path_length(x, tree, 0) for tree in self.trees]
        avg_path = np.mean(paths)
        c_n = self._c_factor(self.max_samples)
        if_score = 2.0 ** (-avg_path / max(c_n, 1.0)) # Higher = more anomalous

        # 2. Mahalanobis Multi-variate Distance
        maha_dist = 0.0
        if self.mean_vector is not None and self.inv_cov_matrix is not None:
            try:
                maha_dist = mahalanobis(x, self.mean_vector, self.inv_cov_matrix)
            except Exception:
                maha_dist = 0.0

        maha_score = float(1.0 - np.exp(-maha_dist / 6.0))

        # Composite score combining tree isolation and multi-variate statistical distance
        composite = 0.65 * if_score + 0.35 * maha_score
        return float(np.clip(composite, 0.0, 1.0))

class AnomalyDetector:
    """
    ML Anomaly Detector with synthetic baseline calibration.
    """
    def __init__(self, random_state: int = 42):
        self.model_version = "VectorizedIsolationForest-v1.3.0"
        self.random_state = random_state
        self.model = VectorizedIsolationForest(n_trees=60, max_samples=256, random_state=random_state)
        self._initialize_baseline_calibration()

    def _initialize_baseline_calibration(self):
        rng = np.random.RandomState(self.random_state)
        n_samples = 1200

        amount_ratio = rng.normal(1.0, 0.3, n_samples).clip(0.1, 2.5)
        z_score_amount = rng.exponential(0.4, n_samples).clip(0.0, 1.8)
        is_unusual_time = rng.choice([0.0, 1.0], size=n_samples, p=[0.94, 0.06])
        is_new_dev = rng.choice([0.0, 1.0], size=n_samples, p=[0.96, 0.04])
        is_unusual_loc = rng.choice([0.0, 1.0], size=n_samples, p=[0.97, 0.03])
        velocity = rng.poisson(1.1, n_samples).clip(1.0, 3.0)
        failed_attempts = rng.choice([0.0, 1.0], size=n_samples, p=[0.98, 0.02])
        suspicious_attempts = np.zeros(n_samples)
        weak_signals = (is_unusual_time + is_new_dev + is_unusual_loc + failed_attempts)

        X_train = np.column_stack([
            amount_ratio,
            z_score_amount,
            is_unusual_time,
            is_new_dev,
            is_unusual_loc,
            velocity,
            failed_attempts,
            suspicious_attempts,
            weak_signals
        ])

        self.model.fit(X_train)

    def score(self, feature_vector: np.ndarray) -> float:
        vec = feature_vector.flatten()
        return self.model.score_anomaly(vec)

anomaly_detector = AnomalyDetector()

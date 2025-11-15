"""Policy registry for snow plow routing."""

from typing import Dict

from backend.policies.base import BasePolicy
from backend.policies.naive import NaivePolicy
from backend.policies.finite_horizon_greedy import FiniteHorizonGreedyPolicy


# Policy registry mapping policy names to instances
POLICY_REGISTRY: Dict[str, BasePolicy] = {
    "naive": NaivePolicy(),
    "finite_horizon_greedy": FiniteHorizonGreedyPolicy(),
}


def get_policy(name: str) -> BasePolicy:
    """
    Get a policy instance by name.
    
    Args:
        name: The name of the policy to retrieve
        
    Returns:
        The policy instance
        
    Raises:
        ValueError: If the policy name is not found in the registry
    """
    if name not in POLICY_REGISTRY:
        available = ", ".join(POLICY_REGISTRY.keys())
        raise ValueError(
            f"Policy '{name}' not found. Available policies: {available}"
        )
    return POLICY_REGISTRY[name]


def list_policies() -> list[str]:
    """
    Get a list of all available policy names.
    
    Returns:
        List of policy names
    """
    return list(POLICY_REGISTRY.keys())


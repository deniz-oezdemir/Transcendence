from django.core.cache import cache
from django.conf import settings
from django.db import models


class GameStateManager(models.Manager):
    def get_queryset(self):
        if settings.USE_REDIS:
            return super().get_queryset().filter(id__in=self._get_ids_from_redis())
        else:
            return super().get_queryset()

    def _get_ids_from_redis(self):
        keys = cache.keys("game_state_*")
        ids = []
        for key in keys:
            try:
                id_str = key.split("_")[2]
                id_int = int(id_str)
                ids.append(id_int)
            except (IndexError, ValueError):
                continue
        return ids

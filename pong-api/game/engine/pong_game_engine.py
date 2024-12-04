from ..models import GameState


class PongGameEngine:
    def __init__(self, game_state: GameState):
        self.game_state = game_state
        self.game_state = game_state.is_game_running
        self.game_height = 600
        self.paddle_height = 100

    def update_game_state(self):
        pass

    def move_player(self, player_id, direction):
        if player_id == self.game_state.player_1_id:
            if direction == 1:
                self.game_state.player_1_position -= 10
            elif direction == -1:
                self.game_state.player_1_position += 10

            # Ensure the player doesn't move out of bounds
            self.game_state.player_1_position = max(
                0,
                min(
                    self.game_height - self.paddle_height,
                    self.game_state.player_1_position,
                ),
            )

        elif player_id == self.game_state.player_2_id:
            if direction == 1:
                self.game_state.player_2_position -= 10
            elif direction == -1:
                self.game_state.player_2_position += 10

            # Ensure the player doesn't move out of bounds
            self.game_state.player_2_position = max(
                0,
                min(
                    self.game_height - self.paddle_height,
                    self.game_state.player_2_position,
                ),
            )

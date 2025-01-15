from ..models import GameState


class PongGameEngine:
    def __init__(self, game_state: GameState):
        self.game_state = game_state
        self.game_height = 600
        self.game_width = 800
        self.paddle_height = 100
        self.paddle_width = 10

    def update_game_state(self):
        if not self.game_state.is_game_running or self.game_state.is_game_ended:
            return

        # Update the positions of the ball
        self.game_state.ball_x_position += self.game_state.ball_x_velocity
        self.game_state.ball_y_position += self.game_state.ball_y_velocity

        # Check for collisions with the top and bottom walls
        if (
            self.game_state.ball_y_position <= 0
            or self.game_state.ball_y_position >= self.game_height
        ):
            self.game_state.ball_y_velocity *= -1

        # Check for collisions with the paddles
        if (
            (0 + self.paddle_width)
            <= self.game_state.ball_x_position
            <= self.game_width - self.paddle_width
        ):
            if self._check_paddle_collision(
                self.game_state.player_1_id, self.game_state.player_1_name
            ):
                self.game_state.ball_x_velocity *= -1
            if self._check_paddle_collision(
                self.game_state.player_2_id, self.game_state.player_2_name
            ):
                self.game_state.ball_x_velocity *= -1

        # Check for scoring
        if self.game_state.ball_x_position <= 0:
            self._score_point(
                self.game_state.player_2_id, self.game_state.player_2_name
            )
        elif self.game_state.ball_x_position >= self.game_width:
            self._score_point(
                self.game_state.player_1_id, self.game_state.player_1_name
            )

        # Save the updated game state
        self.game_state.save()

    def move_player(self, player_id, direction):
        if not self.game_state.is_game_running or self.game_state.is_game_ended:
            return

        if player_id == self.game_state.player_1_id:
            player_position = self.game_state.player_1_position
        elif player_id == self.game_state.player_2_id:
            player_position = self.game_state.player_2_position
        else:
            return

        if direction == 1:
            player_position -= 10
        elif direction == -1:
            player_position += 10

        # Ensure the player doesn't move out of bounds
        player_position = max(
            0, min(self.game_height - self.paddle_height, player_position)
        )

        if player_id == self.game_state.player_1_id:
            self.game_state.player_1_position = player_position
        elif player_id == self.game_state.player_2_id:
            self.game_state.player_2_position = player_position

        # Save the updated player state
        self.game_state.save()

    def _check_paddle_collision(self, player_id, player_name):
        # Check if the ball collides with the player's paddle
        if player_id == self.game_state.player_1_id:
            paddle_top = self.game_state.player_1_position
        elif player_id == self.game_state.player_2_id:
            paddle_top = self.game_state.player_2_position
        else:
            return False

        paddle_bottom = paddle_top + self.paddle_height
        ball_y = self.game_state.ball_y_position

        return paddle_top <= ball_y <= paddle_bottom

    def _score_point(self, player_id, player_name):
        # Increment the player's score
        if player_id == self.game_state.player_1_id:
            self.game_state.player_1_score += 1
        elif player_id == self.game_state.player_2_id:
            self.game_state.player_2_score += 1

        # Reset the ball position and velocity
        self.game_state.ball_x_position = self.game_width // 2
        self.game_state.ball_y_position = self.game_height // 2
        self.game_state.ball_x_velocity *= -1
        self.game_state.ball_y_velocity *= -1

        # Check if the game has ended
        if self.game_state.player_1_score >= self.game_state.max_score:
            self.game_state.is_game_ended = True
            self.game_state.is_game_running = False
        elif self.game_state.player_2_score >= self.game_state.max_score:
            self.game_state.is_game_ended = True
            self.game_state.is_game_running = False

        # Save the updated game state
        self.game_state.save()

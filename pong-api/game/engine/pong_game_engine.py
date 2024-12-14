from ..models import GameState, GamePlayer


class PongGameEngine:
    # TODO: check game defaults, remove magic numbers
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
            for player in self.game_state.players.all():
                if self._check_paddle_collision(player):
                    self.game_state.ball_x_velocity *= -1

        # Check for scoring
        if self.game_state.ball_x_position <= 0:
            self._score_point(self.game_state.players.all()[1])
        elif self.game_state.ball_x_position >= self.game_width:
            self._score_point(self.game_state.players.all()[0])

        # Save the updated game state
        self.game_state.save()

    def move_player(self, player_id, direction):
        if not self.game_state.is_game_running or self.game_state.is_game_ended:
            return

        player = self.game_state.players.get(player__id=player_id)
        if direction == 1:
            player.player_position -= 10
        elif direction == -1:
            player.player_position += 10

        # Ensure the player doesn't move out of bounds
        player.player_position = max(
            0,
            min(
                self.game_height - self.paddle_height,
                player.player_position,
            ),
        )

        # Save the updated player state
        player.save()

    def _check_paddle_collision(self, player: GamePlayer):
        # Check if the ball collides with the player's paddle
        paddle_top = player.player_position
        paddle_bottom = player.player_position + self.paddle_height
        ball_y = self.game_state.ball_y_position

        return paddle_top <= ball_y <= paddle_bottom

    def _score_point(self, player: GamePlayer):
        # Increment the player's score
        player.player_score += 1
        player.save()

        # Reset the ball position and velocity
        self.game_state.ball_x_position = self.game_height // 2
        self.game_state.ball_y_position = self.game_height // 2
        self.game_state.ball_x_velocity *= -1
        self.game_state.ball_y_velocity *= -1

        # Check if the game has ended
        if player.player_score >= self.game_state.max_score:
            self.game_state.is_game_ended = True
            self.game_state.is_game_running = False
            self.game_state.save()

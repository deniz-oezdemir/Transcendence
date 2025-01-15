from ..models import GameState
import logging

logger = logging.getLogger("pongApi")


class PongGameEngine:
    def __init__(self, game_state: GameState):
        self.game_state = game_state
        self.game_height = 1200
        self.game_width = 1600
        self.paddle_height = 100
        self.paddle_width = 10
        logger.info("PongGameEngine initialized with game state: %s", game_state)

    def update_game_state(self):
        logger.info("Updating game state")
        if not self.game_state.is_game_running or self.game_state.is_game_ended:
            logger.info("Game is not running or has ended")
            return

        # Update the positions of the ball
        self.game_state.ball_x_position += self.game_state.ball_x_velocity
        self.game_state.ball_y_position += self.game_state.ball_y_velocity
        logger.debug(
            "Ball position updated: x=%s, y=%s",
            self.game_state.ball_x_position,
            self.game_state.ball_y_position,
        )

        # Check for collisions with the top and bottom walls
        if self.game_state.ball_y_position <= 0:
            self.game_state.ball_y_velocity *= -1
            self.game_state.ball_y_position += self.game_state.ball_y_velocity
            logger.info(
                f"Ball collided with top wall and bounced back. New velocity: {self.game_state.ball_y_velocity}"
            )
        elif self.game_state.ball_y_position >= self.game_height:
            self.game_state.ball_y_velocity *= -1
            self.game_state.ball_y_position += self.game_state.ball_y_velocity
            logger.info(
                f"Ball collided with bottom wall and bounced back. New velocity y: {self.game_state.ball_y_velocity}; x: {self.game_state.ball_x_velocity}"
            )

        # Log the ball's position and velocity after handling collisions
        logger.info(
            f"Ball position y: {self.game_state.ball_y_position} ; x: {self.game_state.ball_x_position}, Ball velocity y: {self.game_state.ball_y_velocity}; x: {self.game_state.ball_x_velocity}"
        )

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
                logger.info("Ball collided with player 1 paddle")
            if self._check_paddle_collision(
                self.game_state.player_2_id, self.game_state.player_2_name
            ):
                self.game_state.ball_x_velocity *= -1
                logger.info("Ball collided with player 2 paddle")

        # Check for scoring
        if self.game_state.ball_x_position <= 0:
            self._score_point(
                self.game_state.player_2_id, self.game_state.player_2_name
            )
            logger.info("Player 2 scored a point")
        elif self.game_state.ball_x_position >= self.game_width:
            self._score_point(
                self.game_state.player_1_id, self.game_state.player_1_name
            )
            logger.info("Player 1 scored a point")

        # Save the updated game state
        self.game_state.save()
        logger.debug("Game state saved")

    def move_player(self, player_id, direction):
        logger.debug("Moving player: player_id=%s, direction=%s", player_id, direction)
        if not self.game_state.is_game_running or self.game_state.is_game_ended:
            logger.info("Game is not running or has ended")
            return

        if player_id == self.game_state.player_1_id:
            player_position = self.game_state.player_1_position
        elif player_id == self.game_state.player_2_id:
            player_position = self.game_state.player_2_position
        else:
            logger.warning("Invalid player_id: %s", player_id)
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
        logger.debug(
            "Player position updated and saved: player_id=%s, position=%s",
            player_id,
            player_position,
        )

    def _check_paddle_collision(self, player_id, player_name):
        # Log each variable separately before the if/elif conditions
        logger.debug(
            "Checking paddle collision for player_id=%s, player_name=%s",
            player_id,
            player_name,
        )
        logger.debug(
            "player_1_id=%s, player_2_id=%s",
            self.game_state.player_1_id,
            self.game_state.player_2_id,
        )
        logger.debug(
            "player_1_position=%s, player_2_position=%s",
            self.game_state.player_1_position,
            self.game_state.player_2_position,
        )

        # Check if the ball collides with the player's paddle
        if player_id == self.game_state.player_1_id:
            paddle_top = self.game_state.player_1_position
        elif player_id == self.game_state.player_2_id:
            paddle_top = self.game_state.player_2_position
        else:
            logger.warning("Invalid player_id for paddle collision: %s", player_id)
            return False

        paddle_bottom = paddle_top + self.paddle_height
        ball_y = self.game_state.ball_y_position

        logger.debug(
            "Paddle collision details: paddle_top=%s, paddle_bottom=%s, ball_y=%s",
            paddle_top,
            paddle_bottom,
            ball_y,
        )

        collision = paddle_top <= ball_y <= paddle_bottom
        logger.info(
            "Paddle collision result for player_id=%s: %s", player_id, collision
        )
        return collision

    def _score_point(self, player_id, player_name):
        # Increment the player's score
        if player_id == self.game_state.player_1_id:
            self.game_state.player_1_score += 1
        elif player_id == self.game_state.player_2_id:
            self.game_state.player_2_score += 1

        logger.info(
            "Player scored: player_id=%s, player_name=%s, player_1_score=%s, player_2_score=%s",
            player_id,
            player_name,
            self.game_state.player_1_score,
            self.game_state.player_2_score,
        )

        # Reset the ball position and velocity
        self.game_state.ball_x_position = self.game_width // 2
        self.game_state.ball_y_position = self.game_height // 2
        self.game_state.ball_x_velocity *= -1
        self.game_state.ball_y_velocity *= -1

        # Check if the game has ended
        if self.game_state.player_1_score >= self.game_state.max_score:
            self.game_state.is_game_ended = True
            self.game_state.is_game_running = False
            logger.info("Game ended: player 1 won")
        elif self.game_state.player_2_score >= self.game_state.max_score:
            self.game_state.is_game_ended = True
            self.game_state.is_game_running = False
            logger.info("Game ended: player 2 won")

        # Save the updated game state
        self.game_state.save()
        logger.debug("Game state saved after scoring")

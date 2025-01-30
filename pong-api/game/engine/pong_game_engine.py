import logging
import math
from ..models import GameState

logger = logging.getLogger(__name__)


class PongGameEngine:
    def __init__(self, game_state: GameState):
        # Only localize variables whos values wont change
        self.game_state = game_state
        self.game_height = game_state.game_height
        self.game_width = game_state.game_width
        self.paddle_height = game_state.paddle_height
        self.paddle_width = game_state.paddle_width
        self.paddle_offset = game_state.paddle_offset
        self.paddle_1_x_position = self.paddle_width + self.paddle_offset
        self.paddle_2_x_position = self.game_width - (
            self.paddle_width + self.paddle_offset
        )
        self.ball_radius = game_state.ball_radius
        self.ball_speed = game_state.ball_speed
        self.player_move_step = game_state.move_step
        logger.debug(
            "PongGameEngine initialized with game state: %s, game_height: %d, game_width: %d, paddle_height: %d, paddle_width: %d, paddle_offset: %d, ball_radius: %d, ball_speed: %f, player_move_step: %d",
            game_state,
            self.game_height,
            self.game_width,
            self.paddle_height,
            self.paddle_width,
            self.paddle_offset,
            self.ball_radius,
            self.ball_speed,
            self.player_move_step,
        )

    def update_game_state(self):
        """
        Updates the game state, including ball position, collision detection,
        and scoring. Saves the updated game state.
        """
        logger.debug("GameEngine: Updating game state")
        if not self.game_state.is_game_running or self.game_state.is_game_ended:
            logger.debug("Game is not running or has ended")
            return

        # Update the positions of the ball
        self.game_state.ball_x_position += self.game_state.ball_x_direction
        self.game_state.ball_y_position += self.game_state.ball_y_direction
        logger.debug(
            "Ball position updated: x=%s, y=%s",
            self.game_state.ball_x_position,
            self.game_state.ball_y_position,
        )

        # Check for collisions with the top and bottom walls
        self._check_wall_collisions()
        self._check_paddle_collision()
        self._check_scoring()

        self.game_state.save()
        logger.debug("GameEngine: Game state saved")
        logger.debug(
            "PongGameEngine saved with game state: game_height: %d, game_width: %d, paddle_height: %d, paddle_width: %d, paddle_offset: %d, ball_radius: %d, player_move_step: %d, ball_y_direction: %f, ball_x_direction: %f",
            self.game_height,
            self.game_width,
            self.paddle_height,
            self.paddle_width,
            self.paddle_offset,
            self.ball_radius,
            self.player_move_step,
            self.game_state.ball_y_direction,
            self.game_state.ball_x_direction,
        )

    def move_player(self, player_id, direction):
        logger.debug("Moving player: player_id=%s, direction=%s", player_id, direction)
        if not self.game_state.is_game_running or self.game_state.is_game_ended:
            logger.debug("Game is not running or has ended")
            return

        if player_id == self.game_state.player_1_id:
            player_position = self.game_state.player_1_position
        elif player_id == self.game_state.player_2_id:
            player_position = self.game_state.player_2_position
        else:
            logger.warning("Invalid player_id: %s", player_id)
            return

        if direction == 1:
            player_position += self.player_move_step
        elif direction == -1:
            player_position -= self.player_move_step

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

    def _check_wall_collisions(self):
        """
        Checks for collisions between the ball and the top or bottom walls.
        Reverses the ball's direction if a collision is detected.
        """
        if self.game_state.ball_y_position - self.ball_radius <= 0:
            self.game_state.ball_y_direction *= -1
            self.game_state.ball_y_position += self.game_state.ball_y_direction
            logger.debug(
                "Ball collided with top wall and bounced back. New direction: %f",
                self.game_state.ball_y_direction,
            )
        elif self.game_state.ball_y_position + self.ball_radius >= self.game_height:
            self.game_state.ball_y_direction *= -1
            self.game_state.ball_y_position += self.game_state.ball_y_direction
            logger.debug(
                "Ball collided with bottom wall and bounced back. New direction y: %f; x: %d",
                self.game_state.ball_y_direction,
                self.game_state.ball_x_direction,
            )

    def _check_paddle_collision(self):
        """
        Checks for collisions between the ball and the paddles.
        Reverses the ball's direction if a collision is detected.
        """
        player_id_to_check = None

        if (
            self.paddle_offset
            <= self.game_state.ball_x_position - self.ball_radius
            <= self.paddle_1_x_position
        ):
            # ball might hit paddle player_1
            player_id_to_check = self.game_state.player_1_id
        elif (
            self.paddle_2_x_position
            <= self.game_state.ball_x_position + self.ball_radius
            <= self.game_state.game_width - self.paddle_offset
        ):
            # ball might hit paddle player_2
            player_id_to_check = self.game_state.player_2_id
        else:
            # No possibility of hit
            return

        logger.info(
            "Ball possibly collided with paddles. Position y: %d ; x: %d",
            self.game_state.ball_y_position,
            self.game_state.ball_x_position,
        )

        if self._handle_paddle_collision(player_id_to_check):
            logger.info(
                "New ball position after colliding with player_%d y: %d ; x: %d, direction: y: %f, x: %f",
                player_id_to_check,
                self.game_state.ball_y_position,
                self.game_state.ball_x_position,
                self.game_state.ball_y_direction,
                self.game_state.ball_x_direction,
            )

    def _handle_paddle_collision(self, player_id):
        """
        Handles the collision between the ball and a paddle.
        Updates the ball's direction based on the collision point.

        Args:
            player_id (int): The ID of the player whose paddle collided with the ball.
        """
        logger.debug(
            "Handling paddle collision for player_id=%s, \
            player_1_id=%s, player_2_id=%s, player_1_position=%s, \
            player_2_position=%s",
            player_id,
            self.game_state.player_1_id,
            self.game_state.player_2_id,
            self.game_state.player_1_position,
            self.game_state.player_2_position,
        )

        # Match ID and find corresponding paddle. If ball behind paddle
        # set ball_x_position to paddle_x position
        if player_id == self.game_state.player_1_id:
            paddle_top = self.game_state.player_1_position
        elif player_id == self.game_state.player_2_id:
            paddle_top = self.game_state.player_2_position
        else:
            logger.warning("Invalid player_id for paddle collision: %s", player_id)
            return False

        paddle_bottom = paddle_top + self.paddle_height
        paddle_middle = (paddle_top + paddle_bottom) / 2
        ball_y = self.game_state.ball_y_position
        if ball_y < paddle_top or ball_y > paddle_bottom:
            logger.debug("Bally Y position outside of paddle")
            return False

        # For cases where ball is "inside" paddle
        self.handle_ball_paddle_collision(
            player_id,
            self.paddle_1_x_position
            if player_id == self.game_state.player_1_id
            else self.paddle_2_x_position,
            self.game_state.ball_x_position,
            self.ball_radius,
            self.game_state.ball_x_direction,
        )

        hit_distance_to_center = ball_y - paddle_middle
        max_y_speed = (
            self.ball_speed * 0.6
        )  # Max percentage of ball_speed that can be "used" in the Y direction
        normalized_hit_distance = (
            hit_distance_to_center
            / (self.paddle_height / 2)
            * (
                max_y_speed
            )  # This will determine Y direction and thus should never equal speed, as that would leave X direction at zero
        )
        normalized_hit_distance = max(
            max_y_speed,
            min(max_y_speed, normalized_hit_distance),
        )

        if hit_distance_to_center > (paddle_bottom - paddle_middle):
            logger.debug(
                "ERROR: hit distance is larger than distance from \
            paddle center to paddle bottom. Setting hit_distance_to_center \
            to paddle_bottom - paddle_middle. Needs review"
            )
            hit_distance_to_center = paddle_bottom - paddle_middle

        # ball_x_direction will be what remains of ball_speed after subtracting
        # ball_y_direction
        self.game_state.ball_y_direction = normalized_hit_distance * -1
        new_x_direction = self.ball_speed - math.fabs(normalized_hit_distance)
        self.game_state.ball_x_direction *= -1
        self.game_state.ball_x_direction = (
            new_x_direction
            if self.game_state.ball_x_direction > 0
            else new_x_direction * -1
        )
        # Inmediatly move ball to avoid some issues
        self.game_state.ball_y_position += self.game_state.ball_y_direction
        print(
            f"gonna add {self.game_state.ball_x_direction} to x position {self.game_state.ball_x_position}"
        )
        self.game_state.ball_x_position += self.game_state.ball_x_direction
        print(f"result: {self.game_state.ball_x_position}")

        return True

    def handle_ball_paddle_collision(
        self,
        player_id,
        paddle_x_position,
        ball_x_position,
        ball_radius,
        ball_x_direction,
    ):
        if player_id == self.game_state.player_1_id:
            if ball_x_position + ball_radius < paddle_x_position:
                self.game_state.ball_x_position = (
                    paddle_x_position + ball_radius + ball_x_direction
                )
                logger.info(
                    "Ball 'inside' paddle_1, position set to: %f",
                    self.game_state.ball_x_position,
                )
        elif player_id == self.game_state.player_2_id:
            if ball_x_position + ball_radius > paddle_x_position:
                self.game_state.ball_x_position = (
                    paddle_x_position - ball_radius - ball_x_direction
                )
                logger.info(
                    "Ball 'inside' paddle_2, position set to: %f",
                    self.game_state.ball_x_position,
                )

    def _check_scoring(self):
        """
        Checks if a player has scored a point. Updates the score and handles
        the scoring event.
        """
        if self.game_state.ball_x_position - self.ball_radius <= 0:
            self._handle_score_point(self.game_state.player_2_id)
            logger.debug("Player 2 scored a point")
        elif self.game_state.ball_x_position + self.ball_radius >= self.game_width:
            self._handle_score_point(self.game_state.player_1_id)
            logger.debug("Player 2 scored a point")

    def _handle_score_point(self, player_id):
        """
        Handles the event when a player scores a point.
        Updates the player's score, resets the ball position and direction,
        and checks if the game has ended based on the maximum score.

        Args:
            player_id (int): The ID of the player who scored.
        """
        logger.debug(f"_handle_score_point() for player id: {player_id}")
        if player_id == self.game_state.player_1_id:
            self.game_state.player_1_score += 1
        elif player_id == self.game_state.player_2_id:
            self.game_state.player_2_score += 1

        logger.debug(
            "Player scored: player_id=%s, player_1_score=%s, player_2_score=%s",
            player_id,
            self.game_state.player_1_score,
            self.game_state.player_2_score,
        )

        # Reset the ball position and direction
        self.game_state.ball_x_position = self.game_width // 2
        self.game_state.ball_y_position = self.game_height // 2
        self.game_state.ball_x_direction *= -1
        self.game_state.ball_y_direction *= -1

        # Check if the game has ended
        if self.game_state.player_1_score >= self.game_state.max_score:
            self.game_state.is_game_ended = True
            self.game_state.is_game_running = False
            logger.debug("Game ended: player 1 won")
        elif self.game_state.player_2_score >= self.game_state.max_score:
            self.game_state.is_game_ended = True
            self.game_state.is_game_running = False
            logger.debug("Game ended: player 2 won")

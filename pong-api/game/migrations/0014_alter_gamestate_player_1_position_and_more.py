from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game', '0013_alter_gamestate_ball_radius_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gamestate',
            name='player_1_position',
            field=models.FloatField(default=15),
        ),
        migrations.AlterField(
            model_name='gamestate',
            name='player_2_position',
            field=models.FloatField(default=15),
        ),
    ]
